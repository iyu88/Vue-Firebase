<template>
  <v-container fluid v-if="items.length">
    <template v-for="(item, i) in items">
      <v-card :key="item.id" :class="i < items.length - 1 ? 'mb-4' : ''" :to="`${boardId}/${item.id}`">
        <v-subheader>
          <v-chip color="info" label small class="mr-4">{{ item.category }}</v-chip>
          <display-time :time="item.createdAt"></display-time>
          <v-spacer/>
          <v-btn icon v-if="fireUser && fireUser.uid === item.uid" :to="`${boardId}/${item.id}?action=write`">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </v-subheader>
        <v-card-title>
          {{ item.title }}
        </v-card-title>
        <v-card-text>
          <viewer v-if="item.summary" :initialValue="item.summary"></viewer>
            <v-container v-else>
                <v-row justify="center" align="center">
                    <v-progress-circular indeterminate></v-progress-circular>
                </v-row>
            </v-container>
        </v-card-text>
        <v-card-actions>
          <display-user :user="item.user"></display-user>
          <v-spacer/>
          <v-sheet class="mr-4">
            <v-icon left :color="item.readCount ? 'info' : ''">mdi-eye</v-icon>
            <span class="body-2">{{ item.readCount }}</span>
          </v-sheet>
          <v-sheet class="mr-4">
            <v-icon left :color="item.commentCount ? 'info' :''">mdi-comment</v-icon>
            <span class="body-2">{{ item.commentCount }}</span>
          </v-sheet>
          <v-sheet class="mr-0">
            <v-icon left :color="item.likeCount ? 'success' : ''">mdi-thumb-up</v-icon>
            <span class="body-2">{{ item.likeCount }}</span>
          </v-sheet>
        </v-card-actions>
      </v-card>
    </template>
    <v-list-item v-if="lastDoc && items.length < board.count">
      <v-btn @click="more" v-intersect="onIntersect" text color="primary" block>더보기</v-btn>
    </v-list-item>
  </v-container>
  <v-container fluid v-else>
    <v-alert type="warning" border="left" class="mb-0">
      게시물이 없습니다.
    </v-alert>
  </v-container>
</template>
<!--
<div>
    <v-data-table
      :headers="headers"
      :items="items"
      :server-items-length="board.count"
      :options.sync="options"
      :items-per-page="5"
      :footer-props="{
        'items-per-page-options':[5, 10, 20, 30, 50],
      }"
      must-sort
      item-key="id"
    >
      <template v-slot:item.createdAt="{item}">
        <display-time :time="item.createdAt"></display-time>
      </template>
      <template v-slot:item.title="{item}">
        <a @click="read(item)">{{ item.title }}</a>
      </template>
      <template v-slot:item.user.displayName="{item}">
        <display-user :user="item.user"></display-user>
      </template>
    </v-data-table>
  </div>
-->
<script>
import { last } from 'lodash'
import DisplayTime from '@/components/display-time.vue'
import DisplayUser from '@/components/display-user.vue'
const LIMIT = 5

export default {
  components: { DisplayTime, DisplayUser },
  props: ['board', 'boardId'],
  data () {
    return {
      /*
      headers: [
        { value: 'createdAt', text: '작성일' },
        { value: 'title', text: '제목' },
        { value: 'user.displayName', text: '작성자' },
        { value: 'readCount', text: '조회수' },
        { value: 'commentCount', text: '댓글' }
      ],
      options: {
        sortBy: ['createdAt'],
        sortDesc: [true]
      },
      docs: []
      */
      items: [],
      unsubscribe: null,
      ref: null,
      order: 'createdAt',
      sort: 'desc'
    }
  },
  computed: {
    fireUser () {
      return this.$store.state.fireUser
    }
  },
  watch: {
    boardId () {
      this.subscribe()
    }
  },
  /*
      this.subscribe(0)
    },
    options: {
      handler (n, o) {
        if (!o.page) {
          this.subscribe(0)
          return
        }
        if (head(o.sortBy) !== head(n.sortBy) || head(o.sortDesc) !== head(n.sortDesc)) {
          n.page = 1
          this.subscribe(0)
          return
        }
        const arrow = n.page - o.page
        this.subscribe(arrow)
      },
      deep: true
    },
    dialog (n) {
      if (!n) this.selectedItem = null
    }
  },
  */
  created () {
    // this.subscribe(0)
    const obj = {}
    // obj.a = 3
    // obj.b = 3
    console.log(Object.keys(obj).length)
    this.subscribe()
  },
  destroyed () {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    snapshotToItems (sn) {
      this.lastDoc = last(sn.docs)
      sn.docs.forEach(doc => {
        const findItem = this.items.find(item => doc.id === item.id)
        const item = doc.data()
        if (!findItem) {
          item.id = doc.id
          item.createdAt = item.createdAt.toDate()
          item.updatedAt = item.updatedAt.toDate()
          this.items.push(item)
        } else {
          if (findItem.summary !== item.summary) {
            findItem.summary = ''
            setTimeout(() => {
              findItem.summary = item.summary
            }, 1000)
          }
          findItem.title = item.title
          findItem.readCount = item.readCount
          findItem.commentCount = item.commentCount
          findItem.likeCount = item.likeCount
          findItem.likeUids = item.likeUids
          findItem.categories = item.categories
          findItem.tags = item.tags
          findItem.updatedAt = item.updatedAt.toDate()
        }
        this.items.sort((before, after) => {
          return Number(after.id) - Number(before.id)
        })
      })
    },
    subscribe (arrow) {
      if (this.unsubscribe) this.unsubscribe()
      this.ref = this.$firebase.firestore().collection('boards').doc(this.boardId).collection('articles').orderBy(this.order, this.sort).limit(LIMIT)
      /*
      const order = this.options.sortBy[0]
      const sort = this.options.sortDesc[0] ? 'desc' : 'asc'
      const limit = this.options.itemsPerPage
      const ref = this.$firebase.firestore().collection('boards').doc(this.boardId).collection('articles').orderBy(order, sort)
      let query
      switch (arrow) {
        case -1: query = ref.endBefore(head(this.docs)).limitToLast(limit)
          break
        case 1: query = ref.startAfter(last(this.docs)).limit(limit)
          break
        default: query = ref.limit(limit)
          break
      }
      */
      this.unsubscribe = this.ref.onSnapshot(sn => {
        if (sn.empty) {
          this.items = []
          return
        }
        this.snapshotToItems(sn)
        /*
        this.docs = sn.docs
        this.items = sn.docs.map(doc => {
          const item = doc.data()
          item.id = doc.id
          item.createdAt = item.createdAt.toDate()
          item.updatedAt = item.updatedAt.toDate()
          return item
        })
        */
      })
    },
    read (item) {
      this.$router.push({ path: this.$route.path + '/' + item.id })
    },
    async more () {
      if (!this.lastDoc) throw Error('더 이상 데이터가 없습니다.')
      const sn = await this.ref.startAfter(this.lastDoc).get()
      this.snapshotToItems(sn)
    },
    onIntersect (entries, observer, isIntersecting) {
      if (isIntersecting) this.more()
    }
  }
}
</script>

<style scoped>
.text-content {
  white-space: pre-wrap;
}
</style>
