import os
import json
import uuid
import base64
import boto3
import sys
import io
from PyPDF2 import PdfReader

from shared.db import DynamoDBClient

s3_client = boto3.client('s3')

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
    # Divide el texto en chunks con solapamiento
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
        
    return chunks

def lambda_handler(event, context):
    # Función principal de AWS Lambda
    
    # Headers para CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    try:
        # 1. Parsear el body JSON
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName')
        file_content_base64 = body.get('fileContent')
        
        if not file_name or not file_content_base64:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'Falta fileName o fileContent'})
            }
            
        # Limpiar el string base64 si tiene prefijo
        if ',' in file_content_base64:
            file_content_base64 = file_content_base64.split(',')[1]
            
        # Decodificar el PDF
        pdf_bytes = base64.b64decode(file_content_base64)
        
        # 2. Generar UUID y subir a S3
        document_id = str(uuid.uuid4())
        bucket_name = os.environ.get('BUCKET_NAME')
        s3_key = f"{document_id}.pdf"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=pdf_bytes,
            ContentType='application/pdf'
        )
        
        # 3. Extraer texto usando PyPDF2 en memoria
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        
        # 4. Concatenar texto de todas las páginas
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        full_text = " ".join(extracted_text)
        
        # 5. Dividir en chunks
        chunks = chunk_text(full_text)
        
        # 6. Guardar chunks en DynamoDB
        db = DynamoDBClient()
        db.save_chunks(document_id, chunks)
        
        # 7. Retornar respuesta
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'documentId': document_id,
                'chunks': len(chunks),
                'message': 'Documento procesado'
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
