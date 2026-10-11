const cloudinary = require(
  "../config/cloudinary"
);

const uploadBuffer = (
  buffer,
  options
) => {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          }
        );

      stream.end(buffer);
    }
  );
};

const uploadAttachment =
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              "No file uploaded.",
          });
      }

      const isImage =
        req.file.mimetype.startsWith(
          "image/"
        );

      const result =
        await uploadBuffer(
          req.file.buffer,
          {
            folder:
              "teamspace",

            resource_type:
              "auto",

            use_filename:
              true,

            unique_filename:
              true,
          }
        );

      return res
        .status(201)
        .json({
          message:
            "File uploaded successfully.",

          attachment: {
            url:
              result.secure_url,

            publicId:
              result.public_id,

            name:
              req.file
                .originalname,

            type:
              req.file
                .mimetype,

            size:
              req.file.size,

            isImage,
          },
        });
    } catch (error) {
      console.error(
        "Upload attachment error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to upload file.",
        });
    }
  };

module.exports = {
  uploadAttachment,
};