import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();

app.use(cors());

app.use(express.json());

app.post("/federal", async (req, res) => {

  const { cnpj } = req.body;

  try {

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      slowMo: 50,
    });

    const page = await browser.newPage();

    await page.goto(
      "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj",
      {
        waitUntil: "domcontentloaded",
      }
    );

    await page.waitForTimeout(15000);

    const input = await page.$(
      'input[placeholder="Informe o CNPJ"]'
    );

    if (!input) {

      return res.json({
        erro: "Campo não encontrado"
      });

    }

    await input.click({
      clickCount: 3
    });

    await page.keyboard.press(
      "Backspace"
    );

    await input.type(
      cnpj,
      {
        delay: 250
      }
    );

    res.json({
      sucesso: true
    });

  } catch (erro) {

    console.log(erro);

    res.json({
      erro: "Erro automação"
    });

  }

});

app.listen(3001, () => {

  console.log(
    "Servidor rodando na porta 3001"
  );

});