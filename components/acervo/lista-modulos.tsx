"use client";

import { useRef } from "react";
import { Clock, FolderOpen, ImageOff, Lock } from "lucide-react";
import { registrarEvento } from "@/app/(app)/acervo-actions";
import { srcSetImagem, urlImagem } from "@/lib/imagem";
import { moduloLiberado, type Modulo, type Plano, type TipoEvento } from "@/lib/tipos";
import { ModalUpgrade } from "./modal-upgrade";

type Props = { modulos: Modulo[]; plano: Plano };
type Estado = "liberado" | "bloqueado" | "em_breve";

export function ListaModulos({ modulos, plano }: Props) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const bloqueados = modulos.filter((m) => !m.em_breve && !moduloLiberado(m, plano));

  function registrar(tipo: TipoEvento, ref: string) {
    // Dispara e segue: a navegação não espera o registro.
    void registrarEvento(tipo, ref);
  }

  if (modulos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-linha bg-white px-5 py-10 text-center">
        <FolderOpen className="mx-auto mb-3 size-8 text-ameixa/40" aria-hidden="true" />
        <p className="text-ameixa/70">Nenhum módulo por aqui ainda. Volte em breve.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((modulo, i) => {
          const estado: Estado = modulo.em_breve
            ? "em_breve"
            : moduloLiberado(modulo, plano)
              ? "liberado"
              : "bloqueado";
          const conteudo = <ConteudoCard modulo={modulo} estado={estado} prioridade={i < 2} />;
          const classe =
            "block w-full overflow-hidden rounded-2xl border border-linha bg-white text-left transition active:scale-[0.99]";

          return (
            <li key={modulo.id}>
              {estado === "em_breve" ? (
                // Não abre nada: só mostra que vem mais conteúdo.
                <div className="block w-full overflow-hidden rounded-2xl border border-linha bg-white">
                  {conteudo}
                </div>
              ) : estado === "liberado" ? (
                <a
                  href={modulo.url_drive}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => registrar("abriu_modulo", modulo.id)}
                  className={classe}
                >
                  {conteudo}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    registrar("viu_bloqueado", modulo.id);
                    modalRef.current?.showModal();
                  }}
                  className={classe}
                >
                  {conteudo}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {bloqueados.length > 0 && <ModalUpgrade ref={modalRef} bloqueados={bloqueados} />}
    </>
  );
}

function ConteudoCard({
  modulo,
  estado,
  prioridade,
}: {
  modulo: Modulo;
  estado: Estado;
  prioridade: boolean;
}) {
  const src = urlImagem(modulo.capa_url, 640);
  const liberado = estado === "liberado";
  const estiloCapa = {
    liberado: "",
    bloqueado: "opacity-35 grayscale-[60%]",
    em_breve: "grayscale opacity-60",
  }[estado];

  return (
    <>
      <div className="relative aspect-video bg-linha/60">
        {src ? (
          <img
            src={src}
            srcSet={srcSetImagem(modulo.capa_url, [400, 640, 960])}
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            alt=""
            loading={prioridade ? "eager" : "lazy"}
            decoding="async"
            className={`size-full object-cover ${estiloCapa}`}
          />
        ) : (
          <div className="grid size-full place-items-center text-ameixa/30">
            <ImageOff className="size-8" aria-hidden="true" />
          </div>
        )}

        {modulo.contador && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ameixa shadow-sm">
            {modulo.contador}
          </span>
        )}

        {estado === "em_breve" && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="flex items-center gap-1.5 rounded-full bg-ameixa px-3.5 py-1.5 text-sm font-semibold text-white shadow-md">
              <Clock className="size-4" aria-hidden="true" />
              Em breve
            </span>
          </div>
        )}

        {estado === "bloqueado" && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-confete text-ameixa shadow-md">
              <Lock className="size-6" strokeWidth={2.25} aria-hidden="true" />
            </span>
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <h3 className={`truncate font-semibold ${liberado ? "" : "text-ameixa/60"}`}>{modulo.titulo}</h3>
        {estado === "em_breve" ? (
          <p className="truncate text-sm text-ameixa/60">{modulo.descricao || "Chega em breve no seu acervo"}</p>
        ) : liberado ? (
          modulo.descricao && <p className="truncate text-sm text-ameixa/70">{modulo.descricao}</p>
        ) : (
          <p className="truncate text-sm font-semibold text-framboesa">Disponível no Kit Completo</p>
        )}
      </div>
    </>
  );
}
