<template>
    <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
    <v-menu offset-y v-else-if="!$store.state.fireUser">
        <template v-slot:activator="{ on }">
            <v-btn icon v-on="on"><v-icon>mdi-account</v-icon></v-btn>
        </template>
        <v-card>
            <v-card-title>로그인</v-card-title>
            <v-divider/>
            <v-card-actions>
                <v-btn color="red" dark @click="signInWithGoogle" block><v-icon left>mdi-google</v-icon>구글로 로그인</v-btn>
            </v-card-actions>
            <v-card-actions>
                <v-btn color="blue" dark @click="signInWithFacebook" block><v-icon left>mdi-facebook</v-icon>페이스북 로그인</v-btn>
            </v-card-actions>
        </v-card>
    </v-menu>

     <v-menu offset-y v-else>
        <template v-slot:activator="{ on }">
            <v-btn icon v-on="on">
                <v-avatar size="32">
                    <v-img :src="$store.state.fireUser.photoURL"></v-img>
                </v-avatar>
            </v-btn>
        </template>
        <v-card>
            <v-card-title>정보</v-card-title>
            <v-divider/>
            <v-card-actions>
                <v-btn color="" dark @click="signOut" block>로그아웃</v-btn>
            </v-card-actions>
        </v-card>
    </v-menu>
</template>

<script>
export default {
  data () {
    return {
      loading: false
    }
  },
  methods: {
    async signInWithGoogle () {
      this.loading = true
      const provider = new this.$firebase.auth.GoogleAuthProvider()
      this.$firebase.auth().languageCode = 'ko'
      try {
        const sn = await this.$firebase.auth().signInWithPopup(provider)
        this.$store.commit('setFireUser', sn.user)
      } finally {
        this.loading = false
      }
    },
    signOut () {
      this.$firebase.auth().signOut()
    },
    async signInWithFacebook () {
      throw Error('추후 구현')
    //   this.loading = true
    //   const provider = new this.$firebase.auth.GoogleAuthProvider()
    //   this.$firebase.auth().languageCode = 'ko'
    //   try {
    //     const sn = await this.$firebase.auth().signInWithPopup(provider)
    //     this.$store.commit('setFireUser', sn.user)
    //   } finally {
    //     this.loading = false
    //   }
    }
  }
}
</script>
