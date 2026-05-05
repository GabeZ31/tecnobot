import os
import boto3
from boto3.dynamodb.conditions import Key

class DynamoDBClient:
    def __init__(self):
        # Inicializa cliente DynamoDB usando variables de entorno
        self.table_name = os.environ.get('TABLE_NAME', 'TecnoBot-Documents')
        self.region = os.environ.get('REGION', 'us-east-1')
        self.dynamodb = boto3.resource('dynamodb', region_name=self.region)
        self.table = self.dynamodb.Table(self.table_name)

    def save_chunks(self, document_id: str, chunks: list[str]):
        # Guarda cada chunk con su respectivo índice
        with self.table.batch_writer() as batch:
            for i, chunk in enumerate(chunks):
                batch.put_item(
                    Item={
                        'documentId': document_id,
                        'chunkIndex': i,
                        'content': chunk
                    }
                )

    def get_chunks(self, document_id: str) -> list[str]:
        # Retorna todos los chunks de un documento ordenados por índice
        response = self.table.query(
            KeyConditionExpression=Key('documentId').eq(document_id)
        )
        items = response.get('Items', [])
        # Asegura que estén ordenados por chunkIndex
        items.sort(key=lambda x: int(x['chunkIndex']))
        return [item['content'] for item in items]

    def list_documents(self) -> list[str]:
        # Retorna lista de documentIds únicos escaneando la tabla
        response = self.table.scan(
            ProjectionExpression='documentId'
        )
        items = response.get('Items', [])
        # Usar un set para obtener IDs únicos
        document_ids = list(set([item['documentId'] for item in items]))
        return document_ids
