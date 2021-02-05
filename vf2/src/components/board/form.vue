<template>
  <v-container fluid>
    <v-form>
      <v-card :loading="loading">
        <v-toolbar color="accent" dense flat dark>
          <v-toolbar-title>게시판 정보 작성</v-toolbar-title>
        <v-spacer/>
        <v-btn icon @click="$router.push('/board/' + boardId)"><v-icon>mdi-arrow-left</v-icon></v-btn>
        <v-btn icon @click="save"><v-icon>mdi-content-save</v-icon></v-btn>
        </v-toolbar>
        <v-card-text>
          <v-text-field v-model="form.category" outlined label="종류"></v-text-field>
          <v-select v-model="form.type" :items="types" outlined label="유형" :disabled="exists"></v-select>
          <v-text-field v-model="form.title" outlined label="제목"></v-text-field>
          <v-textarea v-model="form.description" outlined label="설명"></v-textarea>
        </v-card-text>
        <v-card-text>
          <v-card outlined>
            <v-subheader>등록된 종류</v-subheader>
            <v-card-text>
              <v-chip color="info" small label v-for="(item, i) in form.categories" :key="i" class="mr-2 mb-2">{{ item }}
                <v-icon small right @click="removeCategory(item, i)">mdi-close</v-icon>
              </v-chip>
            </v-card-text>
            <v-card-actions>
              <div width="100">
                <v-text-field v-model="category"
                  append-icon="mdi-plus"
                  label="등록"
                  placeholder="eg) social"
                  hide-details
                  outlined
                  dense
                  @click:append="saveCategory"
                  @keypress.enter="saveCategory"/>
              </div>
            </v-card-actions>
          </v-card>
        </v-card-text>
        <v-card-text>
          <v-card outlined>
            <v-subheader>등록된 태그</v-subheader>
            <v-card-text>
              <v-chip color="info" small label outlined v-for="(item, i) in form.tags" :key="i" class="mr-2 mb-2">{{ item }}
                <v-icon small right @click="removeTag(item, i)">mdi-close</v-icon>
              </v-chip>
            </v-card-text>
            <v-card-actions>
              <div width="100">
                <v-text-field v-model="tag"
                  append-icon="mdi-plus"
                  label="등록"
                  placeholder="eg) vuetify"
                  hide-details
                  outlined
                  dense
                  @click:append="saveTag"
                  @keypress.enter="saveTag" />
              </div>
            </v-card-actions>
          </v-card>
        </v-card-text>
      </v-card>
    </v-form>
  </v-container>
</template>
<script>
export default {
  props: ['boardId', 'action'],
  data () {
    return {
      form: {
        category: '',
        title: '',
        description: '',
        categories: [],
        tags: [],
        type: ''
      },
      exists: false,
      loading: false,
      ref: null,
      category: '',
      tag: '',
      types: ['일반', '갤러리', '페이지']
    }
  },
  watch: {
    boardId () {
      this.fetch()
    }
  },
  created () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.ref = this.$firebase.firestore().collection('boards').doc(this.boardId)
      const doc = await this.ref.get()
      this.exists = doc.exists
      if (this.exists) {
        const item = doc.data()
        this.form.category = item.category
        this.form.title = item.title
        this.form.description = item.description
        this.form.categories = item.categories
        this.form.tags = item.tags
        this.form.type = item.type
      }
    },
    async save () {
      if (!this.$store.state.fireUser.uid) throw Error('로그인이 필요합니다.')
      if (!this.form.category || !this.form.title) throw Error('종류 제목은 필수 항목입니다.')
      const form = {
        category: this.form.category,
        title: this.form.title,
        description: this.form.description,
        updatedAt: new Date(),
        tags: this.form.tags,
        categories: this.form.categories,
        type: this.form.type
      }
      this.loading = true
      try {
        if (!this.exists) {
          form.createdAt = new Date()
          form.count = 0
          form.uid = this.$store.state.fireUser.uid
          form.user = {
            email: this.$store.state.user.email,
            photoURL: this.$store.state.user.photoURL,
            displayName: this.$store.state.user.displayName
          }
          form.readCount = 0
          form.commentCount = 0
          form.likeCount = 0
          // form.categories = ['일반']
          // form.tags = ['vue', 'firebase']
          await this.ref.set(form)
        } else {
          await this.ref.update(form)
        }
        this.$router.push('/board/' + this.boardId)
      } finally {
        this.loading = false
      }
    },
    saveCategory () {
      if (this.category.length > 20) throw Error('문자 개수를 초과했습니다.')
      if (this.category === '전체') throw Error('전체는 사용 불가능합니다.')
      const exists = this.form.categories.includes(this.category)
      if (exists) throw Error('사용되고 있는 종류입니다.')
      this.form.categories.push(this.category)
      this.category = ''
    },
    async removeCategory (item, i) {
      const sn = await this.ref.collection('articles').where('category', '==', item).limit(1).get()
      if (!sn.empty) throw Error('사용되고 있는 종류입니다.')
      this.form.categories.splice(i, 1)
    },
    saveTag () {
      if (this.tag.length > 20) throw Error('문자 개수를 초과했습니다.')
      const exists = this.form.tags.includes(this.tag)
      if (exists) throw Error('사용되고 있는 태그입니다.')
      this.form.tags.push(this.tag)
      this.tag = ''
    },
    async removeTag (item, i) {
      const sn = await this.ref.collection('articles').where('tags', 'array-contains', item).limit(1).get()
      if (!sn.empty) throw Error('사용되고 있는 태그입니다.')
      this.form.tags.splice(i, 1)
    }
  }
}
</script>
