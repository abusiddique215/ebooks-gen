import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import OpenAI from 'openai';
import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';

const s3Client = new S3Client();
const secretsClient = new SecretsManagerClient();
const execPromise = util.promisify(exec);

export const handler = async (event) => {
  try {
    // Retrieve secrets
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: "ebook-generator-secrets" })
    );
    const secrets = JSON.parse(secretResponse.SecretString);
    
    // Set up OpenAI client
    const openai = new OpenAI({ apiKey: secrets.OPENAI_API_KEY });

    // Extract book info from the event
    const bookInfo = event.bookInfo;

    // Your existing eBook generation code here...
    // (Include your outline generation and content creation logic)

    // Convert to Word document
    await execPromise('/opt/python3/bin/python3 convert_to_pdf.py');

    // Upload eBook to S3
    const s3UploadResult = await s3Client.send(new PutObjectCommand({
      Bucket: "your-ebook-bucket-name",
      Key: `${bookInfo.title}.docx`,
      Body: await fs.readFile('ebook.docx')
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "eBook generated and uploaded to S3", 
        s3UploadResult
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error processing request", error: error.message }),
    };
  }
};