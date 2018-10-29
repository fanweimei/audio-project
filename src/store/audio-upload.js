export default {
    namespaced: true,
    state: {
        dataset: [
            {
                title: 'title1...',
                id: '01',
                groupname: '',
                files: [
                    {
                        id: '05',
                        filename: '文件5',
                        status: 1,
                        listening: false,
                        desc: ''
                    }
                ]
            },
            {
                title: 'title2...',
                id: '02',
                groupname: '',
                files: [
                    {
                        id: '01',
                        filename: '文件1',
                        status: 1,
                        listening: false,
                        desc: ''
                    },
                    {
                        id: '02',
                        filename: '文件2',
                        status: 2,
                        listening: true,
                        desc: ''
                    },
                    {
                        id: '03',
                        filename: '文件3',
                        status: 3,
                        listening: false,
                        desc: ''
                    },
                    {
                        id: '04',
                        filename: '文件4',
                        status: 4,
                        listening: false,
                        desc: ''
                    },
                ]
            },
            {
                title: 'title3...',
                id: '03',
                groupname: '',
                files: []
            }
        ]
    },
    getters: {

    },
    mutations: {
        updateGroupName(state, {index, name}) {
            state.dataset[index].name = name;
        }
    },
    actions: {
        
    }
}