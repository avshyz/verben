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

function sterilize(s) {
  return (
    s
      .replace(/[\s]+/gi, " ")
      // Delete superscript strings
      .replace(/\p{No}/gu, "")
      // This part appears in the definition.
      // this is the simplest solution to clean them
      .replace("» ", "")
      .trim()
  );
}

if (alfy.input.length > 2) {
  const data = await alfy.fetch(
    `${BASE_URL}/conjugation?w=${replaceUmlauts(alfy.input)}`,
    {
      json: false,
    }
  );

  const $ = cheerio.load(data);

  const stem = sterilize($("#grundform").text());
  const description = sterilize($("#stammformen").text());

  const defParagraph = $("p > span[lang='en']");
  const def = defParagraph !== null ? sterilize(defParagraph.text()) : null;

  const sentenceParagraph = $("#stammformen~.rAufZu .rLst");
  const sentence =
    sentenceParagraph !== null ? sterilize(sentenceParagraph.text()) : null;

  if (stem && description) {
    alfy.output([
      {
        title: def.length > 0 ? def : stem,
        subtitle: def.length > 0 ? `${stem} → ${description}` : description,
        arg: [
          `${stem} → ${description}`,
          def,
          `${BASE_URL}/conjugation?w=${replaceUmlauts(alfy.input)}`,
          sentence,
        ].join(ARG_DELIM),
      },
    ]);
  } else {
    const messages = [];
    $("a.vSuchWrt").each(function (i, elem) {
      const title = sterilize($(this).find(".rRechts+span").text());
      const subtitle = sterilize($(this).find("br+span").text());
      messages.push({
        title,
        subtitle,
        arg: [
          `${title} → ${subtitle}`,
          "",
          BASE_URL + $(this).attr("href"),
          "",
        ].join(ARG_DELIM),
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
