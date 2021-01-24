<template>
    <v-card>
    <v-card-title>board test</v-card-title>
    <v-data-table
    :headers="headers"
    :items="items"
    :items-per-page="5"
    :options.sync="options"
    :server-items-length="serverItemsLength"
    must-sort
    >
        <template v-slot:item.id="{ item }">
            <v-btn icon @click="openDialog(item)"><v-icon>mdi-pencil</v-icon></v-btn>
            <v-btn icon @click="remove(item)"><v-icon>mdi-delete</v-icon></v-btn>
        </template>
         <template v-slot:item.createdAt="{ item }">
            {{ item.createdAt.toLocaleString() }}
        </template>
    </v-data-table>
    <v-card-actions>
        <!-- <v-btn icon @click="read"><v-icon>mdi-page-next</v-icon></v-btn> -->
        <v-btn icon @click="openDialog(null)"><v-icon>mdi-pencil</v-icon></v-btn>
    </v-card-actions>
    <v-dialog max-width="500" v-model="dialog">
        <v-card>
            <v-form>
                <v-card-text>
                    <v-form>
                        <v-text-field v-model="form.title"/>
                        <v-text-field v-model="form.content"/>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer/>
                    <v-btn @click="update" v-if="selectedItem">update</v-btn>
                    <v-btn @click="add" v-else>add</v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>
    </v-card>
</template>
<script>
import { head, last } from 'lodash'

export default {
  data () {
    return {
      headers: [
        { value: 'createdAt', text: '작성일' },
        { value: 'title', text: '제목' },
        { value: 'content', text: '내용' },
        { value: 'id', text: 'ID', sortable: false }
      ],
      dialog: false,
      items: [],
      form: {
        title: '',
        content: ''
      },
      selectedItem: null,
      unsubscribe: null,
      unsubscribeCount: null,
      serverItemsLength: 0,
      options: {
        sortBy: ['createdAt'],
        sortDesc: [true]
      },
      docs: []
    }
  },
  watch: {
    options: {
      handler (n, o) {
        // console.log(o)
        // console.log(n)
        const arrow = n.page - o.page
        this.subscribe(arrow)
      },
      deep: true
    }
  },
  created () {
    // this.read()
    // this.subscribe()
  },
  destroy () {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
    if (this.unsubscribeCount) {
      this.unsubscribeCount()
    }
  },
  methods: {
    subscribe (arrow) {
      this.unsubscribeCount = this.$firebase.firestore().collection('meta').doc('boards').onSnapshot((doc) => {
        if (!doc.exists) return
        this.serverItemsLength = doc.data().count
      })
      const order = head(this.options.sortBy)
      const sort = head(this.options.sortDesc) ? 'desc' : 'asc'
      const limit = this.options.itemsPerPage

      const ref = this.$firebase.firestore().collection('boards').orderBy(order, sort)
      let query
      switch (arrow) {
        case -1:
          query = ref.endBefore(head(this.docs)).limitToLast(limit)
          break
        case 1:
          query = ref.startAfter(last(this.docs)).limit(limit)
          break
        default:
          query = ref.limit(limit)
          break
      }

      this.unsubscribe = query.onSnapshot((sn) => {
        if (sn.empty) {
          this.items = []
          return
        }
        console.log('here')
        this.docs = sn.docs
        console.log(head(sn.docs).data())
        console.log(last(sn.docs).data())
        this.items = sn.docs.map(v => {
          const item = v.data()
          return {
            id: v.id,
            title: item.title,
            content: item.content,
            createdAt: item.createdAt.toDate()
          }
        })
      })
    },
    openDialog (item) {
      this.selectedItem = item
      this.dialog = true
      if (!item) {
        this.form.title = ''
        this.form.content = ''
      } else {
        this.form.title = item.title
        this.form.content = item.content
      }
    },
    add () {
      const item = {}
      Object.assign(item, this.form)
      item.createdAt = new Date()
      this.$firebase.firestore().collection('boards').add(item)
      this.dialog = false
    },
    /*
    async read () {
      const sn = await this.$firebase.firestore().collection('boards').get()
      sn.docs.forEach(v => {
        console.log(v.id)
        console.log(v.data())
      })
      this.items = sn.docs.map(v => {
        const item = v.data()
        return {
          id: v.id,
          title: item.title,
          content: item.content
        }
      })
      console.log(this.items)
    },
    */
    remove (item) {
      this.$firebase.firestore().collection('boards').doc(item.id).delete()
    },
    update () {
      this.$firebase.firestore().collection('boards').doc(this.selectedItem.id).update(this.form)
      this.dialog = false
    }
  }
}
</script>
