const CDNBaseURL = "https://example.com";

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
    pg.select("id", "url", "formats", "video_thumbnail")
      .from("files")
      .where("provider", "local")
      .orWhere("provider", "aws-s3")
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
}

const FORMAT_KEYS = ["large", "small", "medium", "thumbnail"];

function patchOriginalFiles(files) {
  return files.map(({ id, formats, url, video_thumbnail }) => {
    console.log(`Patching fileID: ${id}`);
    const newUrl = url.replace("/uploads", CDNBaseURL);
    const newVideoThumbnail = video_thumbnail
      ? video_thumbnail.replace("/uploads", CDNBaseURL)
      : null;
    if (formats !== null)
      FORMAT_KEYS.forEach((formatKey) => {
        if (formats[formatKey]) {
          formats[formatKey].url = formats[formatKey].url.replace(
            "/uploads",
            CDNBaseURL
          );
        }
      });

    return {
      id,
      formats,
      url: newUrl,
      video_thumbnail: newVideoThumbnail,
      provider: "strapi-provider-upload-aws-s3-advanced",
    };
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

  pg.destroy();
}
init();
