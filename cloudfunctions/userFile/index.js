// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const fileID = event.fileID
  const id = event.id
  if(fileID){
    const res = await cloud.deleteFile({
      fileList:[fileID]
    })
  }
  const res = await db.collection('user-file').doc(id).remove()
  return {
    res 
  }
}