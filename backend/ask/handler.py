import os
import json
import re
import traceback
import boto3

from shared.db import DynamoDBClient

bedrock_client = boto3.client('bedrock-runtime', region_name=os.environ.get('REGION', 'us-east-1'))
cors_origin = os.environ.get('CORS_ORIGIN', 'https://tecno-bot.netlify.app')
model_id = os.environ.get('MODEL_ID', 'amazon.nova-lite-v1:0')

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': cors_origin,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
    }

    request_headers = event.get('headers') or {}
    origin = request_headers.get('origin') or request_headers.get('Origin')
    if origin and origin != cors_origin:
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'message': 'Origen no permitido'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
    except (json.JSONDecodeError, TypeError):
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'message': 'JSON no válido'})
        }

    try:
        document_id = body.get('documentId')
        question = body.get('question')
        
        if not document_id or not question:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'Falta documentId o question'})
            }
        if not isinstance(document_id, str) or not re.fullmatch(
            r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}',
            document_id
        ):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'documentId no válido'})
            }
            
        if not isinstance(question, str) or len(question.strip()) > 2000:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'La pregunta no puede superar 2000 caracteres'})
            }

        db = DynamoDBClient()
        chunks = db.get_relevant_chunks(document_id, question)
        
        if not chunks:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'message': 'Documento no encontrado o sin texto'})
            }
            
        context_text = ""
        for chunk in chunks:
            if len(context_text) + len(chunk) > 8000:
                break
            context_text += chunk + " "
            
        prompt = f"""Eres un asistente que responde preguntas basándose ÚNICAMENTE en el siguiente documento.
Si la respuesta no está en el documento, dilo claramente.

DOCUMENTO:
{context_text}

PREGUNTA:
{question}

RESPUESTA:"""

        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ]
        }
        
        response = bedrock_client.invoke_model(
            modelId=model_id,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        response_body = json.loads(response['body'].read().decode('utf-8'))
        answer = response_body.get('output', {}).get('message', {}).get('content', [{'text': ''}])[0].get('text', '')
        
        if not answer and 'content' in response_body:
             answer = response_body['content'][0].get('text', '')

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'answer': answer.strip(),
                'documentId': document_id
            })
        }
        
    except Exception:
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'message': 'No se pudo obtener una respuesta'
            })
        }
