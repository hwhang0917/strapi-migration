const S3BaseURL = "https://example.com";

const pg = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "anvilpwd123",
    database: "postgres",
  },
});

async function getOriginalFiles() {
  return new Promise((resolve, reject) => {
    pg.select("id", "url", "formats")
      .from("files")
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

function patchOriginalFiles(files) {
  return files.map(({ id, formats, url }) => {
    console.log(`Patching fileID: ${id}`);
    const newUrl = url.replace("/uploads", S3BaseURL);
    const newFormatArray = Object.values(formats).map(({ url, ...rest }) => {
      const newFormatUrl = url.replace("/uploads", S3BaseURL);
      return { ...rest, url: newFormatUrl };
    });

    const newFormats = {
      large: newFormatArray[0],
      small: newFormatArray[1],
      medium: newFormatArray[2],
      thumbnail: newFormatArray[3],
    };
    return { id, formats: newFormats, url: newUrl };
  });
}

async function updateOriginalFile(id, data) {
  return new Promise((resolve, reject) => {
    pg("files")
      .update({ ...data })
      .where({ id })
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

async function init() {
  const result = await getOriginalFiles();
  const patchedFiles = patchOriginalFiles(result);

  for (let i = 0; i < patchedFiles.length; i++) {
    const { id, ...data } = patchedFiles[i];
    console.log(`Updating fileID: ${id}`);
    await updateOriginalFile(id, data);
  }
}
init();
