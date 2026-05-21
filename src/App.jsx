import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function App() {
  const [cnpj, setCnpj] = useState("");
  const [data, setData] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [historico, setHistorico] = useState(
    JSON.parse(localStorage.getItem("historico")) || []
  );

  const pdfRef = useRef();

  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const formatMoney = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  const formatBoolean = (v) => {
    if (v === true || v === "Sim") return "Sim";
    return "Não";
  };

  const consultar = async () => {
    try {
      setLoading(true);
      setErro("");
      setData(null);

      const res = await fetch(
        `https://publica.cnpj.ws/cnpj/${cnpj.replace(/\D/g, "")}`
      );

      if (!res.ok) {
        throw new Error("CNPJ não encontrado ou erro na API");
      }

      const json = await res.json();

      if (!json || !json.razao_social) {
        throw new Error("CNPJ inválido ou sem dados disponíveis");
      }

      setData(json);

      const novoItem = {
        cnpj: json.estabelecimento?.cnpj,
        razao: json.razao_social,
        data: new Date().toLocaleString("pt-BR"),
      };

      const novoHistorico = [novoItem, ...historico];

      setHistorico(novoHistorico);

      localStorage.setItem(
        "historico",
        JSON.stringify(novoHistorico)
      );

    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gerarPDF = async () => {
    const element = pdfRef.current;

    const canvas = await html2canvas(element);

    const dataImg = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();

    const imgProps = pdf.getImageProperties(dataImg);

    const pdfHeight =
      (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(
      dataImg,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    pdf.save("consulta-cnpj.pdf");
  };

  const e = data?.estabelecimento;

  return (
    <div
      style={{
        background: "#0a0a0a",
        minHeight: "100vh",
        color: "#fff",
        padding: 20,
      }}
    >
      <div
        ref={pdfRef}
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          background: "#111",
          padding: 20,
          borderRadius: 10,
        }}
      >
        <h1 style={{ textAlign: "center" }}>
          Consulta CNPJ Completo
        </h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            margin: "20px 0",
          }}
        >
          <input
            value={cnpj}
            onChange={(e) =>
              setCnpj(formatCNPJ(e.target.value))
            }
            placeholder="00.000.000/0000-00"
            style={{
              flex: 1,
              padding: 10,
            }}
          />

          <button
            onClick={consultar}
            disabled={loading}
          >
            {loading
              ? "Consultando..."
              : "Consultar"}
          </button>

          <button onClick={gerarPDF}>
            Gerar PDF
          </button>
          <button
  onClick={() =>
    window.open(
      "https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PJ/Emitir"
    )
  }
>
  Certidão Federal
</button>

<button
  onClick={() =>
    window.open(
      "https://sintegra.sefaz.go.gov.br/"
    )
  }
>
  Certidão Estadual GO
</button>

<button
  onClick={() =>
    window.open(
      "https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf"
    )
  }
>
  FGTS
</button>

<button
  onClick={() =>
    window.open(
      "https://cndt-certidao.tst.jus.br/inicio.faces"
    )
  }
>
  Trabalhista
</button>
        </div>

        {loading && (
          <p>🔄 Buscando dados... aguarde</p>
        )}

        {erro && (
          <p style={{ color: "red" }}>
            ❌ {erro}
          </p>
        )}

        {data && (
          <>
            {/* EMPRESA */}
            <div
              style={{
                background: "#000",
                padding: 15,
                marginBottom: 20,
              }}
            >
              <h2>Empresa</h2>

              <p>
                <b>Razão Social:</b>{" "}
                {data.razao_social}
              </p>

              <p>
                <b>Nome Fantasia:</b>{" "}
                {data.nome_fantasia || "-"}
              </p>

              <p>
                <b>Capital Social:</b>{" "}
                {formatMoney(data.capital_social)}
              </p>

              <p>
                <b>Porte:</b>{" "}
                {data.porte?.descricao}
              </p>

              <p>
                <b>Natureza Jurídica:</b>{" "}
                {data.natureza_juridica?.descricao}
              </p>
            </div>

            {/* LOCALIZAÇÃO */}
            <div
              style={{
                background: "#000",
                padding: 15,
                marginBottom: 20,
              }}
            >
              <h2>Localização</h2>

              <p>
                {e?.logradouro}, {e?.numero}
              </p>

              <p>{e?.bairro}</p>

              <p>
                {e?.cidade?.nome} -{" "}
                {e?.estado?.sigla}
              </p>

              <p>
                <b>CEP:</b> {e?.cep}
              </p>
            </div>

            {/* CONTATO */}
            <div
              style={{
                background: "#000",
                padding: 15,
                marginBottom: 20,
              }}
            >
              <h2>Contato</h2>

              <p>
                <b>Telefone:</b> ({e?.ddd1}){" "}
                {e?.telefone1}
              </p>

              <p>
                <b>Email:</b> {e?.email}
              </p>
            </div>

            {/* FISCAL */}
            <div
              style={{
                background: "#000",
                padding: 15,
                marginBottom: 20,
              }}
            >
              <h2>Fiscal</h2>

              <p>
                <b>Simples Nacional:</b>{" "}
                {formatBoolean(
                  data.simples?.simples
                )}
              </p>

              <p>
                <b>Entrada no Simples:</b>{" "}
                {formatDate(
                  data.simples?.data_opcao_simples
                )}
              </p>

              <p>
                <b>Saída do Simples:</b>{" "}
                {formatDate(
                  data.simples?.data_exclusao_simples
                )}
              </p>

              <br />

              <p>
                <b>MEI:</b>{" "}
                {formatBoolean(
                  data.simples?.mei
                )}
              </p>

              <p>
                <b>Entrada no MEI:</b>{" "}
                {formatDate(
                  data.simples?.data_opcao_mei
                )}
              </p>

              <p>
                <b>Saída do MEI:</b>{" "}
                {formatDate(
                  data.simples?.data_exclusao_mei
                )}
              </p>

              <br />

              <p>
                <b>Inscrição Estadual:</b>{" "}
                {e?.inscricoes_estaduais?.[0]
                  ?.inscricao_estadual || "-"}
              </p>
            </div>

            {/* ATIVIDADE */}
            <div
              style={{
                background: "#000",
                padding: 15,
                marginBottom: 20,
              }}
            >
              <h2>Atividade</h2>

              <p>
                <b>Principal:</b>{" "}
                {
                  e?.atividade_principal
                    ?.descricao
                }
              </p>

              <h3
                style={{
                  marginTop: 10,
                }}
              >
                Secundárias:
              </h3>

              {e?.atividades_secundarias?.map(
                (a, i) => (
                  <p key={i}>
                    • {a.descricao}
                  </p>
                )
              )}
            </div>

            {/* SÓCIOS */}
            <div
              style={{
                background: "#000",
                padding: 15,
                marginBottom: 20,
              }}
            >
              <h2>Sócios</h2>

              {data.socios?.map((s, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 10,
                  }}
                >
                  <p>
                    <b>Nome:</b> {s.nome}
                  </p>

                  <p>
                    <b>Qualificação:</b>{" "}
                    {
                      s.qualificacao_socio
                        ?.descricao
                    }
                  </p>

                  <p>
                    <b>Entrada:</b>{" "}
                    {formatDate(
                      s.data_entrada
                    )}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* HISTÓRICO */}
        <div
          style={{
            background: "#000",
            padding: 15,
            marginTop: 20,
          }}
        >
          <h2>Histórico</h2>

          {historico.length === 0 && (
            <p>
              Nenhuma consulta realizada.
            </p>
          )}

          {historico.map((item, i) => (
            <div
              key={i}
              style={{
                borderBottom:
                  "1px solid #333",
                padding: 10,
              }}
            >
              <p>
                <b>{item.razao}</b>
              </p>

              <p>{item.cnpj}</p>

              <p>{item.data}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}