import { NextResponse } from 'next/server';
import { getStoryById } from '@/lib/stories-service';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ code: 400, status: 'Bad Request', error: 'Missing id' }, { status: 400 });
    }
    const story = getStoryById(id);
    if (!story) {
      return NextResponse.json({ code: 404, status: 'Not Found', error: 'Story not found' }, { status: 404 });
    }
    return NextResponse.json({ code: 200, status: 'OK', data: { story } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ code: 500, status: 'ERROR', error: e?.message || String(e) }, { status: 500 });
  }
}