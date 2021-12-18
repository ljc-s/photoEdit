const app = getApp()

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		photoSizeList: app.globalData.photoSizeList,
		width: '',
		height: '',
		px: '',
		size: '自定义',
		photoName: '自定义尺寸',
		discription: '',
		authSatus:false,
		preImgInfoList:[]
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		
		const {index,width,height,discription,data} = options
		if (width && height) {
			this.setData({px: width + ' * ' + height + '像素', width: +width, height: +height, discription});
		}else if(data){
			let newData = JSON.parse(data);
			console.log("数据------"+newData.width_px);
			this.setData({ 
				width:+newData.width_px, 
				height:+newData.height_px, 
				px:newData.width_px+" * "+newData.height_px + " 像素", 
				size:newData.width_mm+" × "+newData.height_mm + " mm", 
				photoName: "基本信息", 
				discription: newData.name 
			});
		}else{
			
			const {width, height, px, size, name, discription} = this.data.photoSizeList[index];
			this.setData({ width, height, px, size, photoName: name, discription: discription });
		}
		wx.setNavigationBarTitle({ title: this.data.photoName })
		this.getUserAuthSatus()
		this.getPreImgInfoList()
	},

		/**
	 * 选择照片
	 */
	chooseImagePre (e) {
		
		const that = this
		if(!this.data.authSatus){
			wx.getUserProfile({
				desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
				success: (res) => {
					
					that.setUserInfo(res.userInfo)
					that.chooseImage(e.target.dataset.type)	
				},
				fail(){
					wx.showToast({ title: '请授权后继续', icon: 'none', duration: 2000 })
				}
			})
		}else{
			that.chooseImage(e.target.dataset.type)	
		}
	},
	onShow: function () {
		this.timerFunc()
	},

	// 定时器，解决第一次进入页面没有openid 的问题
	timerFunc () {
		const openid = app.globalData.openid
		if (openid) {
			this.getUserAuthSatus()
		} else {
			setTimeout(() => this.timerFunc(), 1000)
		}
	},
	//获取标题图片
	getPreImgInfoList(){
		wx.showLoading({ title: '加载中', })
		const that = this
		const db = wx.cloud.database()
		db.collection('preImgInfoList').get().then(res => {
			res.data.forEach(e => {
				e.imgUrl = e.imgUrl.trim()
			});
		  that.setData({
			preImgInfoList:res.data
		  })
		  wx.hideLoading()
		})
	},
	getUserAuthSatus(){
		
		const that = this
		const openid = app.globalData.openid
		if (!openid) return
		const db = wx.cloud.database()
		db.collection('user').where({ openid }).get().then(res => {
			if(res.data[0].nickName){
				this.setData({
					authSatus:true
				})
			}
		})
	},
	chooseImage(sourceType){
		const that = this;
		wx.showLoading({title: '选择照片'})
		setTimeout(function () {
			wx.hideLoading()
		  }, 1000)
		if(sourceType==='camera'){
			const { width, height, photoName} = this.data
			//选择相机拍照
			wx.getSetting({
				success(res) {
					if (res.authSetting['scope.camera']) {
						wx.navigateTo({
							url: '/pages/autoCamera/autoCamera',
							success: function (res) {
								res.eventChannel.emit('toAutoCamera', {
								width,
								height,
								photoName
								})
							}
						})
					} else {
						wx.authorize({
							scope: 'scope.camera',
							success () {
							},
							fail(){
								that.openConfirm()	
							}
						  })
					}
				},
				fail () {
					
				}
			})
			
		}else{
			//选择打开相册
			wx.chooseMedia({
				count: 1,
				mediaType: 'image',
				sourceType: [sourceType],
				sizeType: 'original',
				camera: 'back',
				success:(res)=> {
				this.imgUpload(res.tempFiles[0].tempFilePath)
				
				},
				fail () {
				wx.showToast({ title: '取消选择', icon: 'none', duration: 2000 })
				}
			})
		}
	},
	openConfirm() {
		wx.showModal({
		  content: '检测到您没打开访问摄像头权限，是否打开？',
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
	// 设置用户信息
	setUserInfo (userInfo) {
		
		const openid = app.globalData.openid
		if (!openid) return
		wx.cloud.callFunction({
			name: 'setUserInfo',
			data: {openid, data: userInfo}
		}).then(res => {
			console.log(res)
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
				}
				
			}).catch((error) => {
				wx.hideLoading()
				console.log(error)
				wx.showToast({ 	title: '失败，请重试', icon: 'error' })
			})
		},

		/**
	 * 去编辑页面
	 */
	goEditPage (data) {
		const { width, height, photoName } = this.data
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

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {
		return {
			title: '随时随地可以制作的电子证件照神器！',
			path: '/pages/index/index',
		}
	}
})