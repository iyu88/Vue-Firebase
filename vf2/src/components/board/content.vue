<template>
  <v-container fluid v-if="!loaded">
    <v-skeleton-loader type="card" v-for="i in 3" :key="i"></v-skeleton-loader>
  </v-container>
  <v-container fluid v-else-if="loaded && !board">
    <v-alert type="warning" border="left">
      데이터가 없습니다.
    </v-alert>
  </v-container>
  <v-container fluid :class="$vuetify.breakpoint.xs ? 'pa-0' : ''" v-else>
    <v-card outlined :tile="$vuetify.breakpoint.xs">
      <v-toolbar color="transparent" dense flat >
          <v-sheet width="90" class="mr-4">
            <v-select :value="getCategory" :items="board.categories" @change="changeCategory" dense solo dark single-line hide-details background-color="info" ></v-select>
          </v-sheet>
          <v-toolbar-title v-text="board.title"></v-toolbar-title>
        <v-spacer/>
        <v-btn icon @click="dialog=true"><v-icon>mdi-information-outline</v-icon></v-btn>
        <v-btn icon v-if="board.type === '일반'" @click="$store.commit('toggleBoardType')">
          <v-icon v-text="$store.state.boardTypeList ? 'mdi-format-list-bulleted' : 'mdi-text-box-outline'"></v-icon>
        </v-btn>
        <template v-if="user">
          <!-- <v-btn icon @click="write" :disabled="user.level > 0"><v-icon>mdi-pencil</v-icon></v-btn> -->
          <v-btn icon @click="articleWrite" :disabled="user.level > 4"><v-icon>mdi-plus</v-icon></v-btn>
        </template>
      </v-toolbar>
      <v-divider />
      <board-article :boardId="boardId" :board="board" :category="category"></board-article>
      <v-dialog v-model="dialog" max-width="300">
        <v-card>
          <v-toolbar color="transparent" dense flat>
            <v-toolbar-title> 게시판 정보 </v-toolbar-title>
            <v-spacer/>
            <v-btn icon @click="write" :disabled="user && user.level > 0"><v-icon>mdi-pencil</v-icon></v-btn>
            <v-btn icon @click="dialog=false"><v-icon>mdi-close</v-icon></v-btn>
          </v-toolbar>
          <v-divider/>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                게시판 유형
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ board.type }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                게시판 이름
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ board.title }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                작성자
              </v-list-item-title>
              <v-list-item-subtitle>
                <display-user :user="board.user"></display-user>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                작성일
              </v-list-item-title>
              <v-list-item-subtitle class="font-italic">
                <display-time :time="board.createdAt"></display-time>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                수정일
              </v-list-item-title>
              <v-list-item-subtitle class="font-italic">
                <display-time :time="board.updatedAt"></display-time>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                게시물수
              </v-list-item-title>
              <v-list-item-subtitle class="font-italic">
                {{ board.count }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                등록된 종류
              </v-list-item-title>
              <v-list-item-subtitle class="comment">
                <v-chip color="info" label small v-for="item in board.categories" :key="item" class="mt-2 mr-2" v-text="item"></v-chip>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                등록된 태그
              </v-list-item-title>
              <v-list-item-subtitle class="comment">
                <v-chip color="info" label small outlined v-for="item in board.tags" :key="item" class="mt-2 mr-2" v-text="item"></v-chip>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                설명
              </v-list-item-title>
              <v-list-item-subtitle class="comment" v-text="board.description">
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-divider/>
          <v-card-actions>
            <v-spacer/>
            <v-btn text @click="dialog=false"><v-icon left>mdi-close</v-icon>닫기</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>
<!--
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
-->
<script>
import BoardArticle from './article/index'
import DisplayTime from '@/components/display-time'
import DisplayUser from '@/components/display-user'

export default {
  components: { BoardArticle, DisplayTime, DisplayUser },
  props: ['boardId', 'category'],
  data () {
    return {
      unsubscribe: null,
      board: null,
      loading: false,
      dialog: false,
      loaded: false
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
    },
    getCategory () {
      if (!this.category) return '전체'
      return this.category
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
        this.loaded = true
        if (!doc.exists) return this.write()
        const item = doc.data()
        item.createdAt = item.createdAt.toDate()
        item.updatedAt = item.updatedAt.toDate()
        item.categories.unshift('전체')
        this.board = item
      }, console.err)
    },
    async write () {
      this.$router.push({ path: this.$route.path, query: { action: 'write' } })
    },
    async articleWrite () {
      this.$router.push({ path: this.$route.path + '/' + new Date().getTime(), query: { action: 'write' } })
    },
    changeCategory (item) {
      if (item === '전체') this.$router.push(this.$route.path)
      else this.$router.push({ paht: this.$route.path, query: { category: item } })
    }
  }
}
</script>

<style scoped>
.comment {
  white-space: pre-wrap;
}
</style>
