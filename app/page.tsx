import { redirect } from 'next/navigation';
import { ulid } from 'ulidx';

export default function Index() {
  const id = ulid();
  // 実際のURLは /:id （route groupはURLに現れない）
  redirect(`/${id}` as any);
}
