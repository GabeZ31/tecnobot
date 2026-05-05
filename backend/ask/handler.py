import os
import json
import boto3
import sys

# Agregar la carpeta backend al sys.path para importar shared
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from shared.db import DynamoDBClient

bedrock_client = boto3.client('bedrock-runtime', region_name=os.environ.get('REGION', 'us-east-1'))

def lambda_handler(event, context):
    # Función principal de AWS Lambda para preguntar
    
    # Headers para CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
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
            
        # 2. Obtener chunks de DynamoDB
        db = DynamoDBClient()
        chunks = db.get_chunks(document_id)
        
        if not chunks:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'message': 'Documento no encontrado o sin texto'})
            }
            
        # 3. Construir el contexto (máximo ~8000 caracteres)
        context_text = ""
        for chunk in chunks:
            if len(context_text) + len(chunk) > 8000:
                break
            context_text += chunk + " "
            
        # 4. Construir el prompt y payload para Bedrock
        prompt = f"""Eres un asistente que responde preguntas basándose ÚNICAMENTE en el siguiente documento.
Si la respuesta no está en el documento, dilo claramente.

DOCUMENTO:
{context_text}

PREGUNTA:
{question}

RESPUESTA:"""

        # Formato de payload para amazon.nova-lite-v1:0 usando Messages API
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ]
        }
        
        # Invocar a Bedrock
        response = bedrock_client.invoke_model(
            modelId='amazon.nova-lite-v1:0',
            contentType='application/json',
            accept='application/json',
            body=json.dumps(payload)
        )
        
        # 5. Parsear la respuesta de Bedrock
        response_body = json.loads(response['body'].read().decode('utf-8'))
        answer = response_body.get('output', {}).get('message', {}).get('content', [{'text': ''}])[0].get('text', '')
        
        # Fallback for other standard formats if Nova Lite format changes
        if not answer and 'content' in response_body:
             answer = response_body['content'][0].get('text', '')
        
        # 6. Retornar respuesta
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
