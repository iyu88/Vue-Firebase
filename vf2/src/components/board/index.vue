<template>
    <v-container fluid :class="$vuetify.breakpoint.xs ? 'pa-0' : ''">
        <v-card outlined :tile="$vuetify.breakpoint.xs" v-if="items.length">
            <v-toolbar color="transparent" dense flat>
                <v-toolbar-title>게시판 목록</v-toolbar-title>
                <v-spacer/>
            </v-toolbar>
            <v-card-text>
                <v-row>
                    <v-col cols="12" sm="6" md="4" lg="3" xl="2" v-if="user && user.level === 0">
                        <v-card height="100%">
                            <v-subheader>
                                새로운 게시판 추가
                            </v-subheader>
                            <v-divider/>
                            <v-card-text>
                                <v-text-field
                                v-model="boardId"
                                label="게시판 아이디"
                                placeholder="주소에 사용될 문자입니다"
                                outlined />
                            </v-card-text>
                            <v-card-actions v-if="boardId">
                                <v-btn
                                :to="`${$route.path}/${boardId}`"
                                x-large
                                color="primary"
                                text
                                block>
                                    <v-icon>mdi-plus</v-icon>
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="4" lg="3" xl="2" v-for="(item) in items" :key="item.id">
                        <v-card height="100%">
                            <v-subheader>
                                {{ item.title }}
                                <v-spacer/>
                                <template v-if="user && user.level === 0">
                                    <v-btn icon :to="`${$route.path}/${item.id}?action=write`">
                                        <v-icon>mdi-pencil</v-icon>
                                    </v-btn>
                                    <v-btn icon @click="remove(item)">
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                </template>
                            </v-subheader>
                            <v-divider/>
                            <v-card-text>
                                <v-alert border="left" type="info" outlined class="white-space">{{ item.description }}</v-alert>
                            </v-card-text>
                            <v-list-item>
                                <v-list-item-content>
                                    <v-list-item-title>
                                        게시물수
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="font-italic">
                                        {{ item.count }}
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </v-list-item>
                            <v-divider/>
                            <v-list-item :to="`${$route.path}/${item.id}`">
                                <v-list-item-content>
                                    전체
                                </v-list-item-content>
                                <v-list-item-action>
                                    <v-btn icon>
                                        <v-icon>mdi-menu-right</v-icon>
                                    </v-btn>
                                </v-list-item-action>
                            </v-list-item>
                            <v-divider/>
                            <template v-for="(category, i) in item.categories">
                                <v-list-item :key="category" :to="`${$route.path}/${item.id}?category=${category}`">
                                    <v-list-item-content>
                                        {{ category }}
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <v-btn icon>
                                            <v-icon>mdi-menu-right</v-icon>
                                        </v-btn>
                                    </v-list-item-action>
                                </v-list-item>
                                <v-divider :key='i'/>
                            </template>
                        </v-card>
                    </v-col>
                    <v-col cols="12" sm="6" md="4" lg="3" xl="2" v-if="lastDoc">
                        <v-container fluid fill-height>
                            <v-btn @click="more" v-intersect="onIntersect" text color="primary" block :loading="loading">
                                <v-icon>mdi-dots-horizontal</v-icon>더보기
                            </v-btn>
                        </v-container>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    <v-skeleton-loader v-else type="card"></v-skeleton-loader>
    </v-container>
</template>

<script>
import { last } from 'lodash'
const LIMIT = 5

export default {
  props: ['category'],
  data () {
    return {
      unsubscribe: null,
      ref: null,
      items: [],
      order: 'createdAt',
      sort: 'desc',
      lastDoc: null,
      loading: false,
      boardId: ''
    }
  },
  created () {
    this.subscribe()
  },
  destroyed () {
    if (this.unsubscribe) this.unsubscribe()
  },
  computed: {
    user () {
      return this.$store.state.user
    }
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
          findItem.title = item.title
          findItem.updatedAt = item.updatedAt.toDate()
          findItem.count = item.count
          findItem.category = item.category
          findItem.categories = item.categories
          findItem.tags = item.tags
          findItem.description = item.description
          findItem.user.email = item.user.email
          findItem.user.displayName = item.user.displayName
          findItem.user.photoURL = item.user.photoURL
        }
        this.items.sort((before, after) => {
          return Number(after.createdAt.getTime()) - Number(before.createdAt.getTime())
        })
      })
    },
    subscribe () {
      if (this.unsubscribe) this.unsubscribe()
      this.ref = this.$firebase.firestore().collection('boards').orderBy(this.order, this.sort).limit(LIMIT)
      this.unsubscribe = this.ref.onSnapshot(sn => {
        if (sn.empty) {
          this.items = []
          return
        }
        this.snapshotToItems(sn)
      })
    },
    async more () {
      if (!this.lastDoc) throw Error('더 이상 데이터가 없습니다.')
      if (this.loading) return
      this.loading = true
      try {
        const sn = await this.ref.startAfter(this.lastDoc).get()
        this.snapshotToItems(sn)
      } finally {
        this.loading = false
      }
    },
    onIntersect (entries, observer, isIntersecting) {
      if (isIntersecting) this.more()
    },
    async remove (item) {
      await this.$firebase.firestore().collection('boards').doc(item.id).delete()
      const i = this.items.findIndex(el => el.id === item.id)
      this.items.splice(i, 1)
    }
  }
}
</script>
