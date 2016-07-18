before(function () {
    examples = examples || {};
    examples.oneToMany = examples.oneToMany || {};

    // Here:
    // Article (1) <--> (1) Author
    // Article (1) <--> (*) Comment
    examples.oneToMany.config = function (ds) {

        var Article = ds.defineResource({
            name: 'article',
            idAttribute: 'id',
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"
                // In the case of one to many we use foreignKey
                hasOne: {
                    author: {
                        localField: 'author',
                        foreignKey: 'articleid'
                    },
                    image: {
                        localField: 'image',
                        localKey: 'imageid'
                    }
                },

                hasMany: {
                    comment: {
                        localField: 'comments',
                        foreignKey: 'articleid'
                    },
                    tag: {
                        localField: 'tags',
                        foreignKey: 'articleid'
                    }
                }
            }
        });

        var Author = ds.defineResource({
            name: 'author',
            idAttribute: 'id',
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    }
                }
            }
        });

        var Comment = ds.defineResource({
            name: 'comment',
            idAttribute: 'id',
            relations: {
                // hasMany uses "localField" and "localKeys" or "foreignKey"
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    }
                },
                hasOne: {
                    author: {
                        localField: 'author',
                        localKey: 'authorid'
                    }
                }
            }
        });

        var Image = ds.defineResource({
            name: 'image',
            relations: {
                belongsTo: {
                    article: {
                        localField: 'article',
                        foreignKey: 'imageid'
                    }
                }
            }
        });

        var Tag = ds.defineResource({
            name: 'tag',
            relations: {
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    }
                }
            }
        });

        return {
            article: Article,
            author: Author,
            comment: Comment
        };
    };
});
