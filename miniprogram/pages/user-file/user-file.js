// pages/user-file/user-file.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userFile:null,
    openid:'',
    listShow:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getUserFileInfo(options.openid)
  },
  getUserFileInfo(openid){
    const that = this
    that.setData({
      openid:openid
    })
    const db = wx.cloud.database()
    db.collection('user-file').where({ openid }).get().then(res => {
      res.data.forEach(e => {
        e.time = e.time.Format('yyyy-MM-dd hh:mm:ss')
      });
      const list = res.data
      if(list.length === 0){
        that.setData({
          listShow:false
        })
        return
      }
      list.sort(function(a, b) {
        return b.time < a.time ? -1 : 1
      })
      that.setData({
        userFile:list
      })
      console.log(this.data.userFile)
    })
  },
  download(e){
    let fileId = e.target.dataset.fileid
    wx.cloud.downloadFile({
      fileID: fileId
    }).then(async(res) => {
      await this.saveImage(res.tempFilePath)
    })
  },
  deleteImg(e){
    let id = e.target.dataset.id
    const that = this
    const openid = that.data.openid
    wx.showModal({
      title: '提示',
      content: '此操作将永久删除文件, 是否继续?',
      success (res) {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'userFile',
            data: { id:id }
          }).then(result=>{
            wx.showLoading({
              title: '加载中',
            })
            setTimeout(function () {
              wx.hideLoading()
            }, 1000)
            
            that.getUserFileInfo(openid);
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
    
   
  },
  // 保存图片到相册
	saveImage(tempFilePath) {
    const that = this
		return new Promise((resolve, reject) => {
			wx.saveImageToPhotosAlbum({
				filePath: tempFilePath,
				success:() => {
					this.setData({ downloadSuccess: true })
					wx.showToast({ title: '下载成功' })
					resolve()
				},
				fail(res) {
          
					wx.getSetting({
						success(res1) {
							if (res1.authSetting['scope.writePhotosAlbum']) {
                
								wx.showToast({ title: '下载失败', icon: 'none' })
								reject(new Error('错误'))
							} else {
                that.openConfirm()
							}
						},
						fail () {
							reject(new Error('错误'))
						}
					})
				},
			})
		})
	},
  openConfirm() {
    wx.showModal({
      content: '检测到您没打开相册的写入相册权限，是否打开？',
      confirmText: "确认",
      cancelText: "取消",
      success: function (res) {
        console.log(res);
        //点击“确认”时打开设置页面
        if (res.confirm) {
          console.log('用户点击确认')
          wx.openSetting({
            success: (res) => { }
          })
        } else {
          console.log('用户点击取消')
        }
      }
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})