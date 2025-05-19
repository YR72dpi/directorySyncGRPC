import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function GET() {
  let scanDir = path.join(process.cwd(), "in");
  
  if (!fs.existsSync(scanDir)) {
    scanDir = path.join(process.cwd(), "../runner/in")
    console.log(scanDir)
    if(!fs.existsSync(scanDir)) {

      return new NextResponse('Directory not found', { status: 500 });
    }
  }
    
    

  const files = fs.readdirSync(scanDir).sort();
  let content = '';

  for (const file of files) {
    const filePath = path.join(scanDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      const fileContent = fs.readFileSync(filePath);
      content += fileContent.toString();
    }
  }

  const hash = crypto.createHash('md5').update(content).digest('hex');

  return NextResponse.json({ hash });
}
