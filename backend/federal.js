import puppeteer from "puppeteer";

async function abrirFederal() {

  // CNPJ QUE FUNCIONOU
  const cnpj = "12246146000104";

  // ABRE O NAVEGADOR
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // NOVA ABA
  const page = await browser.newPage();

  // ABRE O SITE
  await page.goto(
    "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj",
    {
      waitUntil: "networkidle2",
    }
  );

  // ESPERA O SITE CARREGAR
  await new Promise(resolve =>
    setTimeout(resolve, 8000)
  );

  // ESPERA INPUT
  await page.waitForSelector(
    'input[placeholder="Informe o CNPJ"]'
  );

  // CLICA NO CAMPO
  await page.click(
    'input[placeholder="Informe o CNPJ"]'
  );

  // APERTA CTRL+A
  await page.keyboard.down("Control");

  await page.keyboard.press("A");

  await page.keyboard.up("Control");

  // APERTA BACKSPACE
  await page.keyboard.press("Backspace");

  // DIGITA DEVAGAR
  await page.keyboard.type(
    cnpj,
    {
      delay: 150,
    }
  );

  console.log(
    "CNPJ digitado."
  );

}

abrirFederal();