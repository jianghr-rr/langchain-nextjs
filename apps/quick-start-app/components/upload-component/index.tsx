'use client';
import React, { useState } from 'react';
import { Button, FileInput } from 'flowbite-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import { useSession } from '~/context/session-context';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type TextItem = {
  str: string;
};

const UploadComponent: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0); 
  const [loading, setLoading] = useState<boolean>(false);
  const { sessionId } = useSession();

  const sendTextToBackend = async (text: string) => {
    try {
      const response = await axios.post('/api/upload-text', { text, sessionId });
      console.log('Text uploaded and processed:', response.data);
    } catch (error) {
      console.error('Error uploading text:', error);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0] ?? null);
    }
  };

  const handleParsePDF = () => {
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      try {

        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items
            .map((item) => (item as TextItem).str ?? '')
            .join(' ');
        }

        setPdfData(text);
        setLoading(true)
        // Step 4: Send the parsed text to the server for embedding and storage in Pinecone
        await sendTextToBackend(text);
      }
      finally {
        setLoading(false)
      }
    };

    fileReader.readAsArrayBuffer(file);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="p-4 flex gap-4 grow">
      <div className='w-1/2 flex grow flex-col'>
        <FileInput onChange={handleFileChange} />
        <div className='h-0 overflow-auto grow'>
          {file && (<>
              <h3>PDF Preview:</h3>
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page width={600}  key={`page_${index + 1}`} pageNumber={index + 1} />
                ))}
              </Document>
          </>)}
        </div>
      </div>

      <div className='w-1/2 flex grow flex-col'>
        <Button onClick={handleParsePDF} disabled={loading}>
          Parse PDF
        </Button>
        <div className='h-0 overflow-auto grow'>
          {pdfData && (
            <div className="mt-4">
              <h3>Extracted Text:</h3>
              <div>
                <p>{pdfData}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadComponent;
