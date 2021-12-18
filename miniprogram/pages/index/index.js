
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
		photoSizeList: app.globalData.photoSizeList,
		bannerList:[]
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
		// wx.setNavigationBarTitle({ title: '随心证件照' })
		this.getBannerList()
		if (!options.shareOpenid) return
		// console.log(options.date.trim() === new Date().toDateString().trim())
		if (options.date.trim() !== new Date().toDateString().trim()) return
		this.shareSuccess(options.shareOpenid)
		
	},
	//获取标题图片
	getBannerList(){
		wx.showLoading({ title: '加载中', })
		const that = this
		const db = wx.cloud.database()
		db.collection('bannerList').get().then(res => {
			res.data.forEach(e => {
				e.imgUrl = e.imgUrl.trim()
			});
		  that.setData({
			bannerList:res.data
		  })
		  wx.hideLoading()
		})
	},
	// 去选择照片页面
	goNextPage (e) {
		wx.navigateTo({
			// url: '/pages/example/example?index=' + e.currentTarget.dataset.index,
			url: '/pages/preImgEdit/preImgEdit?index=' + e.currentTarget.dataset.index,
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
	},
	
	onShow () {
	}
})