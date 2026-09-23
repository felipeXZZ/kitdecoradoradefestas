import { exigirSessao, type Sessao } from "@/lib/sessao";

/**
 * As ferramentas da fase 2 são exclusivas do Kit Completo. Em vez de esconder a
 * rota, a tela mostra a prévia bloqueada com o botão de upgrade — ver o que ela
 * ainda não tem é o que vende o upgrade.
 */
export async function sessaoComPlano(): Promise<{ sessao: Sessao; liberado: boolean }> {
  const sessao = await exigirSessao();
  return { sessao, liberado: sessao.plano === "completo" };
}
