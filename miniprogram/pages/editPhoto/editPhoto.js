
const hexRgb = require('./hex-rgb')
const { photoSizeList } = getApp().globalData;
const sizeNameList = photoSizeList.map(v => v.name)

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		photoName: '',
		targetWidth: '',
		targetHeight: '',
		showScale: 1,
		tmpOriginImgSrc: '',
		filePath: '',
		bgc: '#ffffff',
		photoBg: '#ffffff',
		rpxRatio: 1, //此值为你的屏幕CSS像素宽度/750，单位rpx实际像素
		array: sizeNameList,
		index: 0,
		initImgWidth: 0,
		initImgHeight: 0,
		originImgWidth: 0,
		originImgHeight: 0,
		width: 0,
		height: 0,
		left: 0,
		top: 0,
		scale: 1,
		rotate: 0,
		
	},

	// 尺寸改变
	bindPickerChange(e) {
		this.setData({ index: e.detail.value })
	},

	// 切换背景
	toggleBg(e) {
		const bgc = e.currentTarget.dataset.color;
		const photoBg = {
			red: '#ff0000',
			blue: '#438edb',
			blue2: '#00bff3',
			white: '#ffffff',
			transparent: 'transparent'
		}[bgc]
		this.setData({
			bgc,
			photoBg
		})
	},


	// 图片合成
	async composeImage () {
		wx.showLoading({ title: '制作中...', })
		const { photoBg, photoName, targetWidth, targetHeight, filePath} = this.data
		const colorObj={
			'#ff0000':'红底',
			'#438edb':'蓝底（普蓝）',
			'#00bff3':'蓝底（湖蓝）',
			'#ffffff':'白底',
		}
		const imgBcgTip = colorObj[photoBg] || '自定义'
		// 将颜色转为 rgba值
		const bgc = hexRgb(photoBg, { format: 'array' })
		// 底图
		const baseImg = { bgc, width: targetWidth, height: targetHeight }
		// 人像图
		const peopleImg = { imgId:filePath,  ...this.computedXY(baseImg, this.data) }
	
		// 组合图片顺序
		const data = [baseImg, peopleImg]
		// 合成图片 返回url
		const { result } = await wx.cloud.callFunction({
			name: 'imageCompose',
			data: { photoName:photoName, imgBcgTip:imgBcgTip, imgType: 'jpg', dataType: 'url', data }
		})

		this.downloadAndToComplate(result.value)

	},

	// 下载并跳转
	async downloadAndToComplate (url) {
		let msg = ''
		try {
			// 下载图片到本地
			const { tempFilePath, dataLength } = await this.downloadImg(url)
			const { targetWidth, targetHeight } = this.data
			const size = (dataLength / 1024).toFixed(2)
			msg = `图片像素${targetWidth + ' * ' + targetHeight}，图片大小${size}kb`

			// 保存图片到相册
			await this.saveImage(tempFilePath)
			console.log(JSON.stringify('./complete/complete?msg=' + msg + '&tempFilePath=' + tempFilePath + '&url=' + url))
			wx.redirectTo({ url: './complete/complete?msg=' + msg + '&tempFilePath=' + tempFilePath + '&url=' + url, })

		} catch (error) {
			console.log(error)
			msg = '下载失败，点击下图预览保存图片。'
			wx.redirectTo({ url: '.ß/complete/complete?msg=' + msg + '&tempFilePath=' + url + '&url=' + url, })
		}
	},

	// 计算相对底图的 x ， y
	computedXY (baseImg, imgData) {
		
		const left = (imgData.left - imgData.initImgWidth / 2)
		const top = (imgData.top - imgData.initImgHeight / 2)
		const noScaleImgHeight = baseImg.width * imgData.initImgHeight / imgData.initImgWidth
		const resultImgWidth = baseImg.width * imgData.scale
		const resultImgHeight = noScaleImgHeight * imgData.scale
		const scaleChangeWidth = (resultImgWidth / 2 - baseImg.width / 2)
		const scaleChangeHeight = (resultImgHeight / 2 - noScaleImgHeight / 2)
		const x = left - scaleChangeWidth
		const y = top - scaleChangeHeight
		return { x, y, width: resultImgWidth, height: resultImgHeight }
	},

	// 将远端图片，下载到本地
	downloadImg (url) {
		return new Promise((resolve, reject) => {
			wx.downloadFile({
				url, //仅为示例，并非真实的资源
				success (res) {
					// 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
					if (res.statusCode === 200) {
						console.log(res)
						resolve(res)
					} else {
						reject(res)
					}
				},
				fail (error) {
					reject(error)
				}
			})
		})
	},

	// 保存图片到相册
	saveImage(tempFilePath) {
		const that = this
		return new Promise((resolve, reject) => {
			wx.saveImageToPhotosAlbum({
				filePath: tempFilePath,
				success:() => {
					wx.showToast({ title: '下载成功' })
					resolve()
				},
				fail(res) {
					wx.getSetting({
						success(res) {
							if (res.authSetting['scope.writePhotosAlbum']) {
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
		  content: '检测到您没打开图库的写入相册权限，是否打开？',
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
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function () {
		wx.setNavigationBarTitle({ title: '生成照片' })
		wx.showLoading({ title: '图片加载中', })

		this.receivingParameters()
		this.setRpxRatio()
		
	},

	// 接收参数
	receivingParameters () {
		// let data = {"tmpOriginImgSrc":"https://6e6f-noco-04nbo-1253571313.tcb.qcloud.la/tmp/originfile/o_fns0JknTEtCywrlYRgV0rctuHs/2021-12-11/201eFQs8tFJi81fc9a8d9f8fd13018c3a2a3f4f5e4c5.jpg?imageMogr2/thumbnail/1500x1500%7CimageMogr2/format/jpg","imageDivisionResultFileId":"cloud://noco-04nbo.6e6f-noco-04nbo-1253571313/tmp/imageDivision/o_fns0JknTEtCywrlYRgV0rctuHs/2021-12-11/1639183683695-0.48051656534170006.png","width":260,"height":378,"photoName":"小一寸"}
		// // let data = {tmpOriginImgSrc: "https://6e6f-noco-04nbo-1253571313.tcb.qcloud.la/t…Mogr2/thumbnail/1500x1500%7CimageMogr2/format/jpg", imageDivisionResultFileId: "cloud://noco-04nbo.6e6f-noco-04nbo-1253571313/tmp/…s/2021-12-09/1639061945056-0.8266014231809276.png", width: 260, height: 378}
		// const {width, height,  photoName, tmpOriginImgSrc, imageDivisionResultFileId} = data
		// this.setData({
		// 	photoName:photoName,
		// 	targetWidth: width,
		// 	targetHeight: height,
		// 	showScale: (480 / (+width)),
		// 	filePath: imageDivisionResultFileId,
		// 	tmpOriginImgSrc
		// })
		
		const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel()
		eventChannel && eventChannel.on('acceptDataFromOpenerPage', (data) => {
			const {width, height, photoName, tmpOriginImgSrc, imageDivisionResultFileId} = data
			console.log(JSON.stringify(data))
			debugger
			this.setData({
				photoName:photoName,
				targetWidth: width,
				targetHeight: height,
				showScale: (480 / (+width)),
				filePath: imageDivisionResultFileId,
				tmpOriginImgSrc
			})
		})
	},

	// 设置屏幕宽度比例
	setRpxRatio () {
		
		const _this = this
		wx.getSystemInfo({
			success(res) {
				_this.setData({ rpxRatio: res.screenWidth / 750 })
			}
		})
	},


	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function (e) {

	},
	// 关闭上拉加载
	onReachBottom: function () {
		return
	},
	bindload: function (e) {
		wx.hideLoading({})
		const that = this
		const photoSizeObj = {
			width: this.data.targetWidth,
			height: this.data.targetHeight
		}
		const { width, height } = e.detail
		const _width = photoSizeObj.width
		const _height = _width * height / width
		
		const imgLoadSetData = {
			originImgWidth: width,
			originImgHeight: height,
			initImgWidth: _width,
			initImgHeight: _height,
			width: _width,
			height: _height,
			left: _width / 2,
			top: _height / 2 + photoSizeObj.height - _height +120
		}
		const outerDataName = e.currentTarget.dataset.dataname
		that.setData(outerDataName ? {
			[outerDataName]: {
				...that.data[outerDataName],
				...imgLoadSetData
			}
		} : imgLoadSetData)
	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {
		return {
			title: '随时随地可以制作的电子证件照神器！',
			path: '/pages/index/index'
		}
	}
})