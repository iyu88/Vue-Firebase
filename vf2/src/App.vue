<template>
  <v-app>
    <v-app-bar app color="primary" dark>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <site-title :title="site.title"></site-title>
    <v-spacer/>
    <v-btn icon @click="save"><v-icon>mdi-check</v-icon></v-btn>
    <v-btn icon @click="read"><v-icon>mdi-numeric</v-icon></v-btn>
    <v-btn icon @click="readOne"><v-icon>mdi-account</v-icon></v-btn>
    <v-btn icon to="/about">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
    <v-btn icon to="/">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
    <v-btn @click="test">test</v-btn>
    <site-sign></site-sign>
    </v-app-bar>
    <v-navigation-drawer app v-model="drawer" width="400">
      <site-menu :items="site.menu"></site-menu>
    </v-navigation-drawer>
    <v-content>
      <router-view/>
    </v-content>
    <site-footer :footer="site.footer"></site-footer>
  </v-app>
</template>

<script>
import SiteTitle from '@/views/site/title'
import SiteFooter from '@/views/site/footer'
import SiteMenu from '@/views/site/menu'
import SiteSign from '@/views/site/sign'

export default {
  components: { SiteTitle, SiteFooter, SiteMenu, SiteSign },
  name: 'App',
  data () {
    return {
      drawer: false,
      site: {
        menu: [
          {
            title: 'home',
            icon: 'mdi-home',
            subItems: [
              {
                title: 'Dashboard',
                to: '/'
              },
              {
                title: 'About',
                to: '/about'
              }
            ]
          },
          {
            title: 'about',
            active: true,
            icon: 'mdi-account',
            subItems: [
              {
                title: 'xxx',
                to: '/xxx'
              }
            ]
          }
        ],
        title: '나의 타이틀',
        footer: '푸터입니다'
      }
    }
  },
  created () {
    this.subscribe()
  },
  /* mounted () {
    console.log(this.$firebase)
  },
  */
  methods: {
    subscribe () {
      this.$firebase.database().ref().child('site').on('value', (sn) => {
        const v = sn.val()
        if (!v) {
          this.$firebase.database().ref().child('site').set(this.site)
          return
        }
        this.site = v
      }, (e) => {
        console.log(e.message)
      })
    },
    save () {
      console.log('save@@@')
      this.$firebase.database().ref().child('abcd').set({
        title: 'abcd', text: 'ttttt'
      })
    },
    read () {
      this.$firebase.database().ref().child('abcd').on('value', (sn) => {
        console.log(sn)
        console.log(sn.val())
      })
    },
    async readOne () {
      const sn = await this.$firebase.database().ref().child('abcd').once('value')
      console.log(sn.val())
    },
    async test () {
      // await this.$firebase.firestore().collection('users').doc(this.$store.state.fireUser.uid).update({ level: 4, visitedAt: new Date(), visitCount: 0 })
      const sn = await this.$firebase.storage().ref().child('boards').child('tt').child('1234567890123456').putString('hi!!!!!')
      console.log(sn)
    }
  }
}
</script>
