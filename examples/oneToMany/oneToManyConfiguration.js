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
                // hasOne uses "localField" and "localKey" or "foreignKey"
                // In the case of one to many we use foreignKey
                hasOne: {
                    author: {
                        localField: 'author',
                        foreignKey: 'articleid'
                    },
                    image: {
                        localField: 'image',
                        foreignKey: 'articleid'
                    }
                },
                
                // hasMany uses "localField" and "localKeys" or "foreignKey"
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
                // belongsTo uses "localField" and "localKey"
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
                // belongsTo uses "localField" and "localKey"
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    }
                },
                // hasOne uses "localField" and "localKey" or "foreignKey"
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
                // belongsTo uses "localField" and "localKey"
                belongsTo: {
                    article: {
                        localField: 'article',
                        localKey: 'articleid'
                    }
                }
            }
        });

        var Tag = ds.defineResource({
            name: 'tag',
            relations: {
                // belongsTo uses "localField" and "localKey"
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
