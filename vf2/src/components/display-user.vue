<template>
    <v-tooltip bottom>
        <template v-slot:activator="{on}">
            <!-- <span v-on="on">{{ user.displayName }}</span> -->
            <v-chip v-on="on" color="accent" :small="size === 'small'">
                <v-avatar left v-if="size !== 'small'">
                    <v-img :src="user.photoURL"></v-img>
                </v-avatar>
                {{ user.displayName }}
            </v-chip>
        </template>
        <span>{{ user.email }}</span>
    </v-tooltip>
</template>
<script>
export default {
  props: ['user', 'size']
}
</script>
