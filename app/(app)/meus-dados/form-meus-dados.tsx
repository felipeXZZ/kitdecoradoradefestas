"use client";

import { useState, useTransition } from "react";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PerfilNegocio } from "@/lib/perfil-negocio";
import { gerarUploadLogo, salvarPerfil, type DadosPerfil } from "./actions";

const INPUT =
  "h-12 w-full rounded-xl border border-linha bg-white px-3 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none";
const LARGURA_LOGO = 600;
const MAXIMO = 2 * 1024 * 1024;

export function FormMeusDados({
  perfil,
  logoUrl,
  primeiraVez,
}: {
  perfil: PerfilNegocio;
  logoUrl: string | null;
  primeiraVez: boolean;
}) {
  const [dados, setDados] = useState<DadosPerfil>({
    nome_negocio: perfil.nome_negocio ?? "",
    nome_responsavel: perfil.nome_responsavel ?? "",
    telefone: telefoneLegivel(perfil.telefone ?? ""),
    cidade: perfil.cidade ?? "",
    documento: documentoLegivel(perfil.documento ?? ""),
    logo_path: perfil.logo_path,
    validade_padrao_dias: perfil.validade_padrao_dias,
    percentual_sinal: perfil.percentual_sinal,
    condicoes_padrao: perfil.condicoes_padrao ?? "",
  });
  const [arquivo, setArquivo] = useState<Blob | null>(null);
  const [previa, setPrevia] = useState<string | null>(logoUrl);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, iniciar] = useTransition();

  const mudar = (parcial: Partial<DadosPerfil>) => {
    setSalvo(false);
    setDados((d) => ({ ...d, ...parcial }));
  };

  async function escolherLogo(file: File) {
    setErro(null);
    if (file.size > MAXIMO) return setErro("Logo acima de 2 MB. Reduza a imagem antes de enviar.");
    try {
      const reduzida = await reduzirImagem(file, LARGURA_LOGO);
      setArquivo(reduzida);
      setPrevia(URL.createObjectURL(reduzida));
      setSalvo(false);
    } catch {
      setErro("Não conseguimos abrir essa imagem. Tente outra.");
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      let logo_path = dados.logo_path;

      if (arquivo) {
        const upload = await gerarUploadLogo(arquivo.type);
        if (!upload.ok) return setErro(upload.mensagem);
        const { error } = await createClient()
          .storage.from("logos")
          .uploadToSignedUrl(upload.caminho, upload.token, arquivo, { contentType: arquivo.type });
        if (error) return setErro(`Falha no envio da logo: ${error.message}`);
        logo_path = upload.caminho;
        setArquivo(null);
        mudar({ logo_path });
      }

      const resposta = await salvarPerfil({ ...dados, logo_path });
      if (!resposta.ok) return setErro(resposta.mensagem);
      setSalvo(true);
    });
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-titulo text-2xl">Meus dados</h1>
        <p className="mt-1 text-ameixa/70">
          {primeiraVez
            ? "Preencha uma vez e todos os seus orçamentos e contratos já saem com os seus dados."
            : "Esses dados aparecem no cabeçalho dos seus orçamentos e documentos."}
        </p>
      </div>

      <div>
        <span className="mb-1 block text-sm font-semibold">Logo (opcional)</span>
        <div className="flex items-center gap-3">
          <label className="grid size-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-linha bg-white">
            {previa ? (
              <img src={previa} alt="" className="size-full object-contain p-1" />
            ) : (
              <ImagePlus className="size-7 text-ameixa/50" aria-hidden="true" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void escolherLogo(f);
              }}
            />
          </label>
          <div className="min-w-0 flex-1 text-sm text-ameixa/70">
            <p>PNG ou JPG, até 2 MB. Reduzimos para 600px automaticamente.</p>
            <p className="mt-1">Sem logo, o PDF usa o nome do negócio em letra grande.</p>
            {previa && (
              <button
                type="button"
                onClick={() => {
                  setArquivo(null);
                  setPrevia(null);
                  mudar({ logo_path: null });
                }}
                className="mt-2 inline-flex h-11 items-center gap-1.5 font-semibold text-ameixa/70"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remover logo
              </button>
            )}
          </div>
        </div>
      </div>

      <Campo rotulo="Nome do negócio">
        <input
          required
          maxLength={120}
          placeholder="Ateliê da Ana Festas"
          className={INPUT}
          value={dados.nome_negocio}
          onChange={(e) => mudar({ nome_negocio: e.target.value })}
        />
      </Campo>

      <Campo rotulo="Seu nome">
        <input
          maxLength={120}
          className={INPUT}
          value={dados.nome_responsavel}
          onChange={(e) => mudar({ nome_responsavel: e.target.value })}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Telefone">
          <input
            type="tel"
            inputMode="tel"
            placeholder="(11) 99999-8888"
            className={INPUT}
            value={dados.telefone}
            onChange={(e) => mudar({ telefone: telefoneLegivel(e.target.value) })}
          />
        </Campo>
        <Campo rotulo="Cidade">
          <input
            maxLength={120}
            className={INPUT}
            value={dados.cidade}
            onChange={(e) => mudar({ cidade: e.target.value })}
          />
        </Campo>
      </div>

      <Campo rotulo="CPF ou CNPJ (opcional)">
        <input
          inputMode="numeric"
          className={INPUT}
          value={dados.documento}
          onChange={(e) => mudar({ documento: documentoLegivel(e.target.value) })}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Validade do orçamento">
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              className={`${INPUT} pr-14`}
              value={dados.validade_padrao_dias}
              onChange={(e) => mudar({ validade_padrao_dias: Number(e.target.value) })}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ameixa/50">
              dias
            </span>
          </div>
        </Campo>
        <Campo rotulo="Sinal para reservar">
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              className={`${INPUT} pr-10`}
              value={dados.percentual_sinal}
              onChange={(e) => mudar({ percentual_sinal: Number(e.target.value) })}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ameixa/50">
              %
            </span>
          </div>
        </Campo>
      </div>

      <Campo rotulo="Condições padrão">
        <textarea
          rows={4}
          maxLength={2000}
          placeholder="Ex: A data só é reservada após o pagamento do sinal. A retirada do material acontece no dia seguinte à festa."
          className="w-full rounded-xl border border-linha bg-white p-3 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none"
          value={dados.condicoes_padrao}
          onChange={(e) => mudar({ condicoes_padrao: e.target.value })}
        />
      </Campo>

      {erro && (
        <p role="alert" className="rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={salvando}
        className={`flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold text-white disabled:opacity-70 ${
          salvo ? "bg-menta" : "bg-framboesa active:bg-framboesa-escura"
        }`}
      >
        {salvando && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {salvo && !salvando && <Check className="size-5" aria-hidden="true" />}
        {salvo && !salvando ? "Dados salvos" : "Salvar meus dados"}
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

// ---------------------------------------------------------------------------

/** Reduz no navegador: nada de imagem de 4 MB subindo do celular dela. */
async function reduzirImagem(file: File, larguraMaxima: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, larguraMaxima / bitmap.width);
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sem canvas");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  // PNG preserva fundo transparente, que é o caso da maioria das logos.
  const tipo = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, tipo, 0.9));
  if (!blob) throw new Error("falha ao converter");
  return blob;
}

function telefoneLegivel(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const corte = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}

function documentoLegivel(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
