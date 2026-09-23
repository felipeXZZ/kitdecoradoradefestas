"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ImagePlus, Loader2 } from "lucide-react";
import { urlImagem } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/client";
import { gerarUploadCapa, salvarModulo, type DadosModulo } from "./actions";

type ModuloBanco = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  contador: string | null;
  url_drive: string;
  plano_minimo: string;
  ordem: number | null;
  ativo: boolean | null;
  em_breve: boolean | null;
};

const INPUT =
  "h-12 w-full rounded-xl border border-linha bg-white px-3 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none";

export function FormModulo({ modulo }: { modulo?: ModuloBanco }) {
  const router = useRouter();
  const [dados, setDados] = useState<DadosModulo>({
    id: modulo?.id,
    titulo: modulo?.titulo ?? "",
    descricao: modulo?.descricao ?? "",
    capa_url: modulo?.capa_url ?? "",
    contador: modulo?.contador ?? "",
    url_drive: modulo?.url_drive ?? "",
    plano_minimo: modulo?.plano_minimo ?? "basico",
    ordem: modulo?.ordem ?? 0,
    ativo: modulo?.ativo ?? true,
    em_breve: modulo?.em_breve ?? false,
  });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  const mudar = (parcial: Partial<DadosModulo>) => setDados((d) => ({ ...d, ...parcial }));
  const capaAtual = previa ?? urlImagem(dados.capa_url, 640);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      let capa_url = dados.capa_url;

      if (arquivo) {
        const upload = await gerarUploadCapa(arquivo.name);
        if (!upload.ok) return setErro(upload.mensagem);
        const { error } = await createClient()
          .storage.from("capas")
          .uploadToSignedUrl(upload.caminho, upload.token, arquivo, { contentType: arquivo.type });
        if (error) return setErro(`Falha no envio da imagem: ${error.message}`);
        capa_url = upload.urlPublica;
      }

      const resposta = await salvarModulo({ ...dados, capa_url });
      if (!resposta.ok) return setErro(resposta.mensagem);
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="-ml-2 inline-flex h-11 items-center gap-1 pr-3 text-sm font-semibold text-ameixa/70">
        <ChevronLeft className="size-5" aria-hidden="true" />
        Módulos
      </Link>
      <h1 className="font-titulo text-2xl">{modulo ? "Editar módulo" : "Novo módulo"}</h1>

      <div>
        <span className="mb-1 block text-sm font-semibold">Capa (16:9)</span>
        <label className="relative grid aspect-video cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-linha bg-white">
          {capaAtual ? (
            <img src={capaAtual} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm text-ameixa/60">
              <ImagePlus className="size-8" aria-hidden="true" />
              Escolher imagem
            </span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 5 * 1024 * 1024) {
                setErro("Imagem acima de 5 MB. Reduza antes de enviar.");
                return;
              }
              setArquivo(f);
              setPrevia(f ? URL.createObjectURL(f) : null);
            }}
          />
        </label>
        {capaAtual && <p className="mt-1 text-sm text-ameixa/60">Toque na imagem para trocar.</p>}
      </div>

      <Campo rotulo="Título">
        <input required maxLength={120} className={INPUT} value={dados.titulo} onChange={(e) => mudar({ titulo: e.target.value })} />
      </Campo>
      <Campo rotulo="Descrição (uma linha)">
        <input maxLength={300} className={INPUT} value={dados.descricao} onChange={(e) => mudar({ descricao: e.target.value })} />
      </Campo>
      <Campo rotulo="Contador">
        <input
          maxLength={40}
          placeholder="48 projetos"
          className={INPUT}
          value={dados.contador}
          onChange={(e) => mudar({ contador: e.target.value })}
        />
      </Campo>
      <Campo rotulo={dados.em_breve ? "URL do Drive (opcional enquanto for em breve)" : "URL do Drive"}>
        <input
          required={!dados.em_breve}
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/..."
          className={INPUT}
          value={dados.url_drive}
          onChange={(e) => mudar({ url_drive: e.target.value })}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Plano mínimo">
          <select className={INPUT} value={dados.plano_minimo} onChange={(e) => mudar({ plano_minimo: e.target.value })}>
            <option value="basico">Básico</option>
            <option value="completo">Kit Completo</option>
          </select>
        </Campo>
        <Campo rotulo="Ordem">
          <input
            type="number"
            inputMode="numeric"
            className={INPUT}
            value={dados.ordem}
            onChange={(e) => mudar({ ordem: Number(e.target.value) || 0 })}
          />
        </Campo>
      </div>

      <label className="flex h-12 items-center gap-3 rounded-xl border border-linha bg-white px-3">
        <input
          type="checkbox"
          className="size-5 accent-framboesa"
          checked={dados.ativo}
          onChange={(e) => mudar({ ativo: e.target.checked })}
        />
        <span className="font-semibold">Ativo (aparece no acervo)</span>
      </label>

      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-linha bg-white px-3 py-2">
        <input
          type="checkbox"
          className="size-5 accent-framboesa"
          checked={dados.em_breve}
          onChange={(e) => mudar({ em_breve: e.target.checked })}
        />
        <span>
          <span className="block font-semibold">Em breve</span>
          <span className="block text-sm text-ameixa/60">Capa em preto e branco, selo “Em breve” e não abre.</span>
        </span>
      </label>

      {erro && (
        <p role="alert" className="rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={salvando}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura disabled:opacity-70"
      >
        {salvando && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        Salvar módulo
      </button>
    </form>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{rotulo}</span>
      {children}
    </label>
  );
}
