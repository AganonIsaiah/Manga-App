'use client';
import { useRouter } from "next/navigation";

export default function Main() {
  const router = useRouter();

  router.push('/home')
  
  return (
   <div></div>
  );
}
