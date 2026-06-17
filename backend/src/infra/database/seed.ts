import "reflect-metadata";
import { AppDataSource } from "./dataSource";
import { Esporte } from "../../domain/entities/Esporte";
import { Quadra } from "../../domain/entities/Quadra";
import { Usuario } from "../../domain/entities/Usuario";
import { ConfiguracaoArena } from "../../domain/entities/ConfiguracaoArena";

async function popularBancoDeDados() {
  await AppDataSource.initialize();
  console.log("   Banco conectado. Populando dados iniciais...");

  const repoEsporte = AppDataSource.getRepository(Esporte);
  const repoQuadra = AppDataSource.getRepository(Quadra);
  const repoUsuario = AppDataSource.getRepository(Usuario);
  const repoConfig = AppDataSource.getRepository(ConfiguracaoArena);

  // Configuração da arena
  const configExistente = await repoConfig.count();
  if (configExistente === 0) {
    const config = repoConfig.create({
      nome: "Arena Beach Pulse",
      endereco: "Rua das Quadras, 123 - Centro",
      telefone: "(31) 99999-0000",
      hora_abertura: "07:00",
      hora_fechamento: "22:00",
    });
    await repoConfig.save(config);
    console.log("Configuração da arena criada");
  }

  // Admin padrão
  const adminExistente = await repoUsuario.findOne({
    where: { email: "admin@arena.com" },
  });
  if (!adminExistente) {
    const admin = repoUsuario.create({
      nome: "Administrador",
      email: "admin@arena.com",
      senha: "admin123",
      telefone: "(31) 99999-0001",
      is_admin: true,
    });
    await repoUsuario.save(admin);
    console.log("Admin criado: admin@arena.com / admin123");
  }

  // Usuário de teste
  const userExistente = await repoUsuario.findOne({
    where: { email: "joao@email.com" },
  });
  if (!userExistente) {
    const user = repoUsuario.create({
      nome: "João Silva",
      email: "joao@email.com",
      senha: "senha123",
      telefone: "(31) 98888-1111",
      is_admin: false,
    });
    await repoUsuario.save(user);
    console.log("Usuário de teste criado: joao@email.com / senha123");
  }

  // Esportes
  const esportesExistentes = await repoEsporte.count();
  if (esportesExistentes === 0) {
    const esportes = [
      { nome_esporte: "Beach Tennis", imagem_url: "", preco_partir: "R$ 80/h" },
      {
        nome_esporte: "Futebol Society",
        imagem_url: "",
        preco_partir: "R$ 120/h",
      },
      {
        nome_esporte: "Vôlei de Praia",
        imagem_url: "",
        preco_partir: "R$ 70/h",
      },
      { nome_esporte: "Basquete", imagem_url: "", preco_partir: "R$ 90/h" },
    ];

    const esportesSalvos: Esporte[] = [];
    for (const e of esportes) {
      const esporte = repoEsporte.create(e);
      esportesSalvos.push(await repoEsporte.save(esporte));
    }
    console.log(
      `${esportesExistentes === 0 ? esportes.length : 0} esportes criados`,
    );

    // Quadras
    type QuadraSeed = {
      nome_quadra: string;
      preco_hora: number;
      esporte_id: string;
      fotos: any[];
      diferenciais: string[];
      ativa: boolean;
      esportes_ids?: string[];
    };

    const quadrasData: QuadraSeed[] = [
      {
        nome_quadra: "Beach Court A",
        preco_hora: 80,
        esporte_id: esportesSalvos[0].id,
        fotos: [],
        diferenciais: ["Coberta", "Iluminação LED", "Vestiário"],
        ativa: true,
      },
      {
        nome_quadra: "Beach Court B",
        preco_hora: 80,
        esporte_id: esportesSalvos[0].id,
        fotos: [],
        diferenciais: ["Ao ar livre", "Areia importada"],
        ativa: true,
      },
      {
        nome_quadra: "Campo Society 1",
        preco_hora: 120,
        esporte_id: esportesSalvos[1].id,
        fotos: [],
        diferenciais: ["Grama sintética", "Goleiras oficiais"],
        ativa: true,
      },
      {
        nome_quadra: "Quadra Vôlei",
        preco_hora: 70,
        esporte_id: esportesSalvos[2].id,
        fotos: [],
        diferenciais: ["Rede oficial", "Coberta"],
        ativa: true,
      },
    ];

    for (const q of quadrasData) {
      const quadra = repoQuadra.create({
        nome_quadra: q.nome_quadra,
        preco_hora: q.preco_hora,
        esporte_id: q.esporte_id,
        esportes_ids_json: JSON.stringify(q.esportes_ids || [q.esporte_id]),
        fotos_json: JSON.stringify(q.fotos),
        diferenciais_json: JSON.stringify(q.diferenciais),
        ativa: q.ativa,
      });
      await repoQuadra.save(quadra);
    }
    console.log(`${quadrasData.length} quadras criadas`);
  }

  console.log("\n Seed concluído com sucesso!");
  console.log("   Credenciais:");
  console.log("   Admin: admin@arena.com / admin123");
  console.log("   Usuário: joao@email.com / senha123");
  await AppDataSource.destroy();
}

popularBancoDeDados().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
