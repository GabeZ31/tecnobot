import os
import json
import boto3

from shared.db import DynamoDBClient

bedrock_client = boto3.client('bedrock-runtime', region_name=os.environ.get('REGION', 'us-east-1'))
cors_origin = os.environ.get('CORS_ORIGIN', '*')
model_id = os.environ.get('MODEL_ID', 'amazon.nova-lite-v1:0')

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': cors_origin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    try:
        # 1. Parsear el body JSON
        body = json.loads(event.get('body', '{}'))
        document_id = body.get('documentId')
        question = body.get('question')
        
        if not document_id or not question:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'Falta documentId o question'})
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
        
    except Exception as e:
        # Manejo de errores
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'message': f"Error interno: {str(e)}"
            })
        }
