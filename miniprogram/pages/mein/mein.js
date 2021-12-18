// miniprogram/pages/mein/mein.js

const app = getApp()
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		userInfo: {},
		authorized: false, // 用户头像昵称授权
		signed: false,
		signInLoading: false,
		canIUseGetUserProfile: true,
		envVersion: wx.getAccountInfoSync().miniProgram.envVersion || 'release'
	},

	// 获取用户信息回调
	bindGetUserInfo (e) {
		if (e.detail.userInfo) {
			this.setUserInfo(e.detail.userInfo)
		}
	},

	// 新的获取用户信息事件回调
	getUserProfile(e) {
    wx.getUserProfile({
      desc: '用于完善资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
		this.setUserInfo(res.userInfo)
      }
    })
  },
	
	// 设置用户信息
	setUserInfo (userInfo) {
		this.setData({
			authorized: !!userInfo.nickName,
			userInfo: {
				...this.data.userInfo,
				...userInfo
			}
		})
		const openid = app.globalData.openid
		if (!openid) return
		wx.cloud.callFunction({
			name: 'setUserInfo',
			data: {openid, data: userInfo}
		}).then(res => {
			console.log(res)
		})
	},

	// 签到
	signIn () {
		if (this.data.signInLoading) return
		if (!this.data.authorized) {
			return wx.showToast({
				title: '请授权登录',
				icon: 'none'
			})
		}
		this.setData({ signInLoading: true })
		wx.cloud.callFunction({
			name: 'useCount',
			data: {inc: 1, signIn: true}
		}).then(res => {
			wx.showToast({ title: '签到成功', })
			this.getUserInfo()
		})
	},
	getUserFile(){
		const openid = app.globalData.openid
		if (!openid) return
		wx.navigateTo({
			url: '/pages/user-file/user-file?openid=' + openid,
		})
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		if (wx.getUserProfile) {
			this.setData({
				canIUseGetUserProfile: true
			})
		}

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	// 从数据库获取用户信息，并更新用户信息
	getUserInfo () {
		// debugger
		const that = this
		const openid = app.globalData.openid
		if (!openid) return
		const db = wx.cloud.database()
		db.collection('user').where({ openid }).get().then(res => {
			// debugger
			this.setData({
				userInfo: res.data[0],
				signed: res.data[0].signInDate.trim() === new Date().toDateString().trim()
			})

			// 
			if (this.data.canIUseGetUserProfile) {
				return this.setUserInfo(res.data[0])
			}
			
			wx.getSetting({
				success (res){
					if (res.authSetting['scope.userInfo']) {
						// 已经授权，可以直接调用 getUserInfo 获取头像昵称
						wx.getUserInfo({
							success: function(res) {
								that.setUserInfo(res.userInfo)
							}
						})
					} else {
						that.setData({
							authorized: false
						})
					}
				}
			})
		})
	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
		this.timerFunc()
	},

	// 定时器，解决第一次进入页面没有openid 的问题
	timerFunc () {
		const openid = app.globalData.openid
		if (openid) {
			this.getUserInfo()
		} else {
			setTimeout(() => this.timerFunc(), 3000)
		}
	},

	
  onShareTimeline: function () {
		return {
			title: '随时随地可以制作的电子证件照神器！',
			path: '/pages/index/index'
		}
	},
})