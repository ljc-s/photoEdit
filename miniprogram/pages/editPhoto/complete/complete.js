// 在页面中定义插屏广告
let interstitialAd = null

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		msg: '',
		tempFilePath: '',
		url: ''
	},



	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		this.setData({
			msg: options.msg,
			tempFilePath: options.tempFilePath,
			url: options.url
		})
	},

	preView () {
		wx.previewImage({
			urls: [this.data.url],
			current: this.data.url
		})
	},
	contineu() {
		debugger
		wx.navigateBack({
			delta: 3   //默认值是1
		})
	},
	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
	},
	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function (res) {
		return {
			title: '随时随地可以制作的电子证件照神器！',
			path: '/pages/index/index',
			imageUrl: this.data.tempFilePath
		}
	}
})