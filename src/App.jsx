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
        throw new Error("CNPJ não encontrado");
      }

      const json = await res.json();

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
        fontFamily: "Arial",
      }}
    >
      <div
        ref={pdfRef}
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: "#111",
          padding: 20,
          borderRadius: 12,
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          Consulta CNPJ Completo
        </h1>

        {/* INPUT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 15,
            marginBottom: 25,
          }}
        >
          <input
            value={cnpj}
            onChange={(e) =>
              setCnpj(formatCNPJ(e.target.value))
            }
            placeholder="00.000.000/0000-00"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: 16,
              boxSizing: "border-box",
            }}
          />

          {/* BOTÕES */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <button
              onClick={consultar}
              disabled={loading}
              style={{
                background: "#fff",
                color: "#000",
                border: "none",
                padding: "12px 18px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {loading
                ? "Consultando..."
                : "Consultar"}
            </button>

            <button
              onClick={gerarPDF}
              style={botao}
            >
              Gerar PDF
            </button>

            <button
              onClick={() =>
                window.open(
                  "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj"
                )
              }
              style={botao}
            >
              Certidão Federal
            </button>

            <button
              onClick={() =>
                window.open(
                  "https://www.sefaz.go.gov.br/certidao/emissao/"
                )
              }
              style={botao}
            >
              Certidão Estadual GO
            </button>

            <button
              onClick={() =>
                window.open(
                  "https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf"
                )
              }
              style={botao}
            >
              FGTS
            </button>

            <button
              onClick={() =>
                window.open(
                  "https://cndt-certidao.tst.jus.br/inicio.faces"
                )
              }
              style={botao}
            >
              Trabalhista
            </button>

            <button
              onClick={() =>
                window.open(
                  "https://varjao.centi.com.br/servicos/certidaonegativa"
                )
              }
              style={botao}
            >
              Certidão Municipal
            </button>
          </div>
        </div>

        {loading && (
          <p>Consultando...</p>
        )}

        {erro && (
          <p style={{ color: "red" }}>
            {erro}
          </p>
        )}

        {data && (
          <>
            <Card title="Empresa">
              <p><b>Razão Social:</b> {data.razao_social}</p>
              <p><b>Fantasia:</b> {data.nome_fantasia || "-"}</p>
              <p><b>Capital:</b> {formatMoney(data.capital_social)}</p>
              <p><b>Porte:</b> {data.porte?.descricao}</p>
            </Card>

            <Card title="Endereço">
              <p>{e?.logradouro}, {e?.numero}</p>
              <p>{e?.bairro}</p>
              <p>{e?.cidade?.nome} - {e?.estado?.sigla}</p>
              <p>CEP: {e?.cep}</p>
            </Card>

            <Card title="Contato">
              <p>Telefone: ({e?.ddd1}) {e?.telefone1}</p>
              <p>Email: {e?.email}</p>
            </Card>

            <Card title="Fiscal">
              <p>Simples: {formatBoolean(data.simples?.simples)}</p>
              <p>Entrada Simples: {formatDate(data.simples?.data_opcao_simples)}</p>
              <p>Saída Simples: {formatDate(data.simples?.data_exclusao_simples)}</p>

              <br />

              <p>MEI: {formatBoolean(data.simples?.mei)}</p>
              <p>Entrada MEI: {formatDate(data.simples?.data_opcao_mei)}</p>
              <p>Saída MEI: {formatDate(data.simples?.data_exclusao_mei)}</p>
            </Card>

            <Card title="Atividade Principal">
              <p>
                {e?.atividade_principal?.descricao}
              </p>
            </Card>

            <Card title="Sócios">
              {data.socios?.map((s, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 10,
                  }}
                >
                  <p><b>{s.nome}</b></p>
                  <p>{s.qualificacao_socio?.descricao}</p>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* HISTÓRICO */}
        <Card title="Histórico">
          {historico.length === 0 && (
            <p>Nenhuma consulta.</p>
          )}

          {historico.map((item, i) => (
            <div
              key={i}
              style={{
                borderBottom: "1px solid #333",
                padding: 10,
              }}
            >
              <p><b>{item.razao}</b></p>
              <p>{item.cnpj}</p>
              <p>{item.data}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

const botao = {
  background: "#1f1f1f",
  color: "#fff",
  border: "1px solid #333",
  padding: "12px 18px",
  borderRadius: 8,
  cursor: "pointer",
};

function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#000",
        padding: 20,
        marginBottom: 20,
        borderRadius: 10,
      }}
    >
      <h2 style={{ marginBottom: 15 }}>
        {title}
      </h2>

      {children}
    </div>
  );
}