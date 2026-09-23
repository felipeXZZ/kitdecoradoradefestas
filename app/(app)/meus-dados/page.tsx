import { FerramentaBloqueada } from "@/components/ferramenta-bloqueada";
import { getPerfilNegocio, perfilCompleto, urlDaLogo } from "@/lib/perfil-negocio";
import { sessaoComPlano } from "@/lib/plano";
import { FormMeusDados } from "./form-meus-dados";

export const metadata = { title: "Meus dados — Kit da Decoradora" };

export default async function MeusDadosPage() {
  const { sessao, liberado } = await sessaoComPlano();

  if (!liberado) {
    return (
      <FerramentaBloqueada
        titulo="Meus dados"
        texto="Preencha uma vez e seus orçamentos, contratos e recibos já saem com o seu nome, sua logo e suas condições."
      />
    );
  }

  const perfil = await getPerfilNegocio(sessao.email);
  const logoUrl = await urlDaLogo(perfil.logo_path);

  return <FormMeusDados perfil={perfil} logoUrl={logoUrl} primeiraVez={!perfilCompleto(perfil)} />;
}
