export default {
    namespaced: true,
    state: {
        dataset: [
            {
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
        },
        createGroup(state, { list }) {
            state.dataset = [...state.dataset, ...list.map(e => {
                return {
                    id: Math.random().toString(36).slice(2),
                    groupname: e.groupname,
                    files: []
                }
            })];
        }
    },
    actions: {
        
    }
}