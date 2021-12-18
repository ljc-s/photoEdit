// pages/autoCamera/autoCamera.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cameraPostion:'back',
    cameraImg:false,
    photoSrc:'',
    photoName:'',
    width:'',
    height:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
     this.recevingData()

  },
  recevingData(){
    
    const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
		eventChannel && eventChannel.on('toAutoCamera', (data) => {
		const {width, height,photoName} = data
    console.log(data)
    
    this.setData({
      width: width,
      height: height,
      photoName:photoName
    })
    })
  },

  takePhoto() {
    if(this.data.photoSrc){
      this.imgUpload(this.data.photoSrc)
    }
   
  },
  trunCameraBtn(){
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          photoSrc: res.tempImagePath,
          cameraImg:true,
        })
      }
    })
  },
  goRepeat(){
    
    this.setData({
      cameraImg:false,
      photoSrc:''
    })

  },
  // 上传原图， 后使用百度人像分割
	imgUpload(filePath) {

    const openid = app.globalData.openid
		if (!openid) return
		wx.showLoading({ title: '正在检测图像中', })
    const fileName = filePath.split('tmp/')[1] || filePath.split('tmp_')[1];
		wx.cloud.uploadFile({
			cloudPath: `tmp/originfile/${openid}/${new Date().Format('yyyy-MM-dd')}/${fileName}`,
			filePath
		})
		.then(res => {
      
       this.imageDivision(res.fileID)
		})
		.catch(error => {
			console.log(error)
			wx.showToast({ title: '失败,请重试', icon: 'loading' })
		})
	},

	// 使用百度人像分割
	imageDivision (fileID) {
		wx.cloud.callFunction({
      name: 'imageDivision',
      data: { fileID }
		})
		.then(({ result }) => {
      wx.hideLoading()
			if(result.res){
				this.goEditPage(result)
				}else{
				wx.showToast({ title: result.msg, icon: 'error' })
        this.goRepeat()
				}
		}).catch((error) => {
			console.log(error)
      wx.hideLoading()
			wx.showToast({ 	title: '失败，请重试', icon: 'error' })
		})
	},

		/**
	 * 去编辑页面
	 */
	goEditPage (data) {
		const { width, height ,photoName} = this.data
		wx.navigateTo({
			url: '/pages/editPhoto/editPhoto',
			success: function (res) {
				res.eventChannel.emit('acceptDataFromOpenerPage', {
					...data,
					width,
					height,
          photoName
				})
			}
		})
	},
  error(e) {
    console.log(e.detail)
  },
  trunCameraPostion(){
    
    if(this.data.cameraPostion==='back'){
      this.setData({
        cameraPostion:'front'
      })
      return
    }
    if(this.data.cameraPostion==='front'){
      this.setData({
        cameraPostion:'back'
      })
      return
    }
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