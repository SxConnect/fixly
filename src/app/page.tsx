import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="mb-3">
            <Image
              src="/logo-flixly-wordmark.png"
              alt="Fixly"
              width={1398}
              height={539}
              priority
              className="w-[260px] h-auto mx-auto"
            />
          </h1>
          <p className="text-lg text-gray-600">
            Crie, venda e divulgue seu ebook com IA
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/register" className="btn-primary block w-full">
            Criar conta grátis
          </Link>
          <Link href="/login" className="btn-secondary block w-full">
            Já tenho conta
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          A IA escreve um rascunho. Leia e corrija antes de vender.
          <br />
          Você responde pelo que publica.
        </p>
      </div>
    </main>
  )
}
