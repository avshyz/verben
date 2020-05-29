const alfy = require("alfy");
const cheerio = require("cheerio");

const BASE_URL = "https://www.verbformen.com/";
const ARG_DELIM = "~";

function replaceUmlauts(foo) {
  value = encodeURIComponent(foo)
    .toLowerCase()
    .replace(/a%cc%88/g, "%C3%A4")
    .replace(/o%cc%88/g, "%C3%B6")
    .replace(/u%cc%88/g, "%C3%BC")
    .replace(/\s+/, "")
    .trim();
  return value;
}

function status(title) {
  alfy.output([
    {
      title,
      arg: "",
    },
  ]);
}

function entry(stem, form, link) {
  return {
    title: stem,
    subtitle: form,
    arg: [`${stem}: ${form}`, link].join(ARG_DELIM),
  };
}

function sterilize(s) {
  return s.replace(/\s+/gi, " ");
}

if (alfy.input.length > 2) {
  const data = await alfy.fetch(
    `${BASE_URL}/?w=${replaceUmlauts(alfy.input)}`,
    {
      json: false,
    }
  );

  const $ = cheerio.load(data);

  const stem = sterilize($("#grundform").text());
  const description = sterilize($("#stammformen").text());
  const defParagraph = $("p > span[lang='en']");

  if (stem && description) {
    alfy.output([
      {
        title: description,
        subtitle: defParagraph ? sterilize(defParagraph.text()) : stem,
        arg: `${BASE_URL}/conjugation?w=${replaceUmlauts(alfy.input)}`,
      },
    ]);
  } else {
    const messages = [];
    $("a.vSuchWrt").each(function (i, elem) {
      messages.push({
        title: sterilize($(this).find(".rRechts+span").text()),
        subtitle: sterilize($(this).find("br+span").text()),
        arg: BASE_URL + $(this).attr("href"),
      });
    });
    if (messages.length > 0) {
      alfy.output(messages);
    } else {
      status("Insufficient Data");
    }
  }
} else {
  status("Type at least three characters");
}
