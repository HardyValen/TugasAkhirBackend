function videoStatusEnum (code) {
  switch (code) {
    case 2000:
      return {
        code: 2000,
        message: "OK"
      }
    case 4000:
      return {
        code: 4000,
        message: "Transcoding failed"
      }
    case 4010:
      return {
        code: 4010,
        message: "Incomplete video segment(s)"
      }
    case 4011:
      return {
        code: 4011,
        message: "The requested video has not yet been transcoded"
      }
    default:
      return {
        code: 4999,
        message: "Unspecified Video Status"
      }
  }
}

module.exports = videoStatusEnum;