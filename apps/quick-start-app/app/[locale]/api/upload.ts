import fs from 'fs';
import formidable from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';
import pdfParse from 'pdf-parse';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).send('Error parsing file');
      return;
    }

    const fileData = fs.readFileSync(files.file.filepath);
    const pdfData = await pdfParse(fileData);

    // 将 pdfData.text 存储到 Pinecone

    res.status(200).send('File processed');
  });
};
