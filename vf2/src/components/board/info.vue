<template>
    <v-container fluid>
        <v-card>
            <v-toolbar color="accent" dense flat dark >
                <v-toolbar-title v-text="board.title"></v-toolbar-title>
            <v-spacer/>
            <template v-if="user">
              <v-btn icon @click="write" :disabled="user.level > 0"><v-icon>mdi-pencil</v-icon></v-btn>
              <v-btn icon @click="articleWrite" :disabled="user.level > 4"><v-icon>mdi-plus</v-icon></v-btn>
            </template>
            </v-toolbar>
            <v-card-text v-if="board.createdAt">
                <v-alert color="info" outlined dismissible>
                    <div style="white-space: pre-line">{{ board.description }}</div>
                    <div class="text-right font-italic caption">작성일 : {{ board.createdAt.toDate().toLocaleString() }}</div>
                    <div class="text-right font-italic caption">수정일 : {{ board.updatedAt.toDate().toLocaleString() }}</div>
                </v-alert>
            </v-card-text>
            <v-card-text>
                articles
            </v-card-text>
            <article-index :boardId="boardId" :board="board" ></article-index>
        </v-card>
    </v-container>
</template>
<script>
import ArticleIndex from './article/index'

export default {
  components: { ArticleIndex },
  props: ['boardId'],
  data () {
    return {
      unsubscribe: null,
      board: {
        category: '',
        title: '',
        description: ''
      },
      loading: false
    }
  },
  watch: {
    boardId () {
      this.subscribe()
    }
  },
  computed: {
    user () {
      return this.$store.state.user
    }
  },
  created () {
    this.subscribe()
  },
  destroy () {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    subscribe () {
      if (this.unsubscribe) this.unsubscribe()
      const ref = this.$firebase.firestore().collection('boards').doc(this.boardId)
      this.unsubscribe = ref.onSnapshot(doc => {
        if (!doc.exists) return this.write()
        this.board = doc.data()
      }, console.err)
    },
    async write () {
      this.$router.push({ path: this.$route.path, query: { action: 'write' } })
    },
    async articleWrite () {
      this.$router.push({ path: this.$route.path + '/new', query: { action: 'write' } })
    }
  }
}
</script>
