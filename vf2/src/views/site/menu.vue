<template>
  <div>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title class="title">
          Application
        </v-list-item-title>
        <v-list-item-subtitle>
          subtext
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-divider></v-divider>
    <v-list>
      <v-list-group
        v-for="(item, i) in items"
        :key="i"
        v-model="item.active"
        :prepend-icon="item.icon"
        no-action
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title v-text="item.title"></v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click="openDialogItem(i)"><v-icon>mdi-pencil</v-icon></v-btn>
          </v-list-item-action>
        </template>

        <v-list-item
          v-for="(subItem,j) in item.subItems"
          :key="j"
          :to="subItem.to"
        >
          <v-list-item-content>
            <v-list-item-title v-text="subItem.title"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="openDialogSubItem(i, -1)" v-if="$store.state.editable">
        <v-list-item-icon :class="$store.state.editable ? 'pl-4':''"><v-icon>mdi-plus</v-icon></v-list-item-icon>
         <v-list-item-content>
            <v-list-item-title>서브추가하기</v-list-item-title>
          </v-list-item-content>
      </v-list-item>
      </v-list-group>
      <v-list-item @click="openDialogItem(-1)" v-if="$store.state.editable">
        <v-list-item-icon><v-icon>mdi-plus</v-icon></v-list-item-icon>
         <v-list-item-content>
            <v-list-item-title>추가하기</v-list-item-title>
          </v-list-item-content>
      </v-list-item>
    </v-list>
    <v-dialog v-model="dialogItem" max-width="400">
      <v-card>
        <v-card-title>수정하기
          <v-spacer/>
          <v-btn icon @click="saveItem"><v-icon>mdi-content-save</v-icon></v-btn>
          <v-btn icon @click="dialogItem=false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="formItem.title" label="메뉴 이름" outlined required/>
          <v-text-field v-model="formItem.to" label="경로" outlined required/>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: ['items'],
  data () {
    return {
      loading: false,
      dialogItem: false,
      dialogSubItem: false,
      formItem: {
        icon: 'mdi-crosshairs-question',
        title: ''
      },
      formSubItem: {
        title: '',
        to: ''
      },
      selectedItemIndex: 0,
      selectedSubItemIndex: 0
    }
  },
  methods: {
    openDialogItem (index) {
      this.selectedItemIndex = index
      if (index < 0) {
        this.formItem.icon = 'mdi-crosshairs-question'
        this.formItem.title = ''
      } else {
        this.formItem.icon = this.items[index].icon
        this.formItem.title = this.items[index].title
      }
      this.dialogItem = true
    },
    async saveItem () {
      if (this.selectedItemIndex < 0) {
        this.items.push(this.formItem)
      } else {
        this.items[this.selectedItemIndex].icon = this.formItem.icon
        this.items[this.selectedItemIndex].title = this.formItem.title
      }
      this.save()
    },
    async save () {
      try {
        this.loading = false
        await this.$firebase.database().ref().child('site').set({ menu: this.items })
      } finally {
        this.dialogItem = false
        this.dialogSubItem = false
        this.loading = false
      }
    },
    openDialogSubItem (index, subIndex) {
      this.selectedItemIndex = index
      this.selectedSubItemIndex = subIndex
      if (subIndex < 0) {
        this.formSubItem.icon = ''
        this.fomrSubItem.title = ''
      } else {
        this.formSubItem.to = this.items[index].subItems[subIndex].to
        this.formSubItem.title = this.items[index].subItems[subIndex].title
      }
    },
    async saveSubItem () {
      if (this.selectedSubItemIndex < 0) {
        if (!this.items[this.selectedItemIndex].subItems) this.items[this.selectedItemIndex].subItems = []
        this.items[this.selectedItemIndex].subItems.push({ title: this.formSubItem.title, to: this.formSubItem.to })
      } else {
        this.items[this.selectedItemIndex].subItems[this.selectedSubItemIndex].title = this.formSubItem.title
        this.items[this.selectedItemIndex].subItems[this.selectedSubItemIndex].to = this.formSubItem.to
      }
      this.save()
    }
  }
}
</script>
