module.exports = {
    title: 'Wangzhumo\'s Blog',
    description: 'Wangzhumo\'s Blog And Notes',


    theme: 'mini',
    themeConfig: {
        hostname: 'https://wangzhumo.com', // provide to enable sitemap and rss feed generation
        ga: 'xxx', // provide to enable google analysis
        siteName: 'Wangzhumo\'s Blog', // site name at navbar
        author: 'Wangzhumo', // author name at footer
        logo: './images/favicon.ico',
        // enable navbar and add links
        navbar: true,
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Archive', link: '/archive/' },
          { text: 'About', link: '/about/' }
        ],
        search: false,
        searchMaxSuggestions: 10
      },
      head: [
        ['link', { rel: 'icon', href: '/images/favicon.ico' }], //favicons，资源放在public文件夹
      ]
}