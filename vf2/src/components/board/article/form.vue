<template>
    <v-container fluid>
      <v-form>
        <v-card :loading="loading">
          <v-toolbar color="accent" dense flat dark>
            <v-toolbar-title>게시판 글 작성</v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="$router.push('/board/' + boardId)"><v-icon>mdi-arrow-left</v-icon></v-btn>
          <v-btn icon @click="save" :disabled="!user"><v-icon>mdi-content-save</v-icon></v-btn>
          </v-toolbar>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="4" v-if="board">
                <v-combobox v-model="form.category" :items="board.categories" label="종류" outlined hide-details />
              </v-col>
              <v-col cols="12" sm="8" v-if="board">
                <v-combobox v-model="form.tags" :items="board.tags" label="태그" outlined multiple small-chips hide-details />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.title" outlined label="제목"></v-text-field>
              </v-col>
              <v-col cols="12">
                <editor v-if="articleId === 'new'" :initialValue="form.content" ref='editor' initialEditType="wysiwyg" height='400px' :options="{ }"></editor>
                <template v-else>
                  <editor v-if="form.content" :initialValue="form.content" ref="editor" initialEditType="wysiwyg" height='400px' :options="{ }"></editor>
                  <v-container v-else>
                    <v-row justify="center" align="center">
                      <v-progress-circular indeterminate></v-progress-circular>
                    </v-row>
                  </v-container>
                </template>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-form>
    </v-container>
</template>
<script>
import axios from 'axios'
import getSummary from '@/util/getSummary.js'

export default {
  props: ['boardId', 'articleId', 'action'],
  data () {
    return {
      // unsubscribe: null,
      form: {
        category: '일반',
        tags: [],
        title: '',
        content: ''
      },
      exists: false,
      loading: false,
      ref: null,
      article: null,
      board: null
    }
  },
  watch: {
    boardId () {
      // this.subscribe()
      this.fetch()
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    },
    fireUser () {
      return this.$store.state.fireUser
    }
  },
  created () {
    // this.subscribe()
    this.fetch()
  },
  // destroyed () {
  //  if (this.unsubscribe) this.unsubscribe()
  // },
  methods: {
    // subscribe () {
    async fetch () {
      this.ref = this.$firebase.firestore().collection('boards').doc(this.boardId)
      const docBoard = await this.ref.get()
      this.board = docBoard.data()
      if (this.articleId === 'new') return
      // if (this.unsubscribe) this.unsubscribe()
      const doc = await this.ref.collection('articles').doc(this.articleId).get()
      this.exists = doc.exists
      if (!this.exists) return
      const item = doc.data()
      this.article = item
      this.form.title = item.title
      this.form.category = item.category
      this.form.tags = item.tags
      const { data } = await axios.get(item.url)
      this.form.content = data
    },
    async save () {
      if (!this.fireUser) throw Error('로그인이 필요합니다.')
      if (!this.form.title) throw Error('제목은 필수 항목입니다.')
      const md = this.$refs.editor.invoke('getMarkdown')
      if (!md) throw Error('내용은 필수 항목입니다.')
      this.loading = true
      try {
        const createdAt = new Date()
        const doc = {
          title: this.form.title,
          category: this.form.category,
          tags: this.form.tags,
          updatedAt: createdAt,
          summary: getSummary(md, 300)
        }

        // const batch = await this.$firebase.firestore().batch()

        if (this.articleId === 'new') {
          const id = createdAt.getTime().toString()
          const fn = id + '-' + this.fireUser.uid + '.md'
          const sn = await this.$firebase.storage().ref().child('boards').child(this.boardId).child(fn).putString(md)
          doc.url = await sn.ref.getDownloadURL()
          doc.createdAt = createdAt
          doc.commentCount = 0
          doc.readCount = 0
          doc.uid = this.$store.state.fireUser.uid
          doc.user = {
            email: this.user.email,
            photoURL: this.user.photoURL,
            displayName: this.user.displayName
          }
          doc.likeCount = 0
          doc.likeUids = []
          // batch.set(this.ref.collection('articles').doc(id), doc)
          // batch.update(this.ref, { count: this.$firebase.firestore.FieldValue.increment(1) })
          await this.ref.collection('articles').doc(id).set(doc)
        } else {
          // batch.update(this.ref.collection('articles').doc(this.articleId), doc)
          const fn = this.articleId + '-' + this.article.uid + '.md'
          await this.$firebase.storage().ref().child('boards').child(this.boardId).child(fn).putString(md)
          await this.ref.collection('articles').doc(this.articleId).update(doc)
        }
        this.$router.push('/board/' + this.boardId)
        // await batch.commit()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
